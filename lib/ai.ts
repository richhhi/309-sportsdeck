import { prisma } from "@/lib/prisma"
import { InferenceClient } from "@huggingface/inference";

// HF Token from environment variables
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
const hf = new InferenceClient(HF_TOKEN);

/**
 * Moderation Check: 
 * Quickly analyzes text and returns true if content is flagged as toxic.
 */
export async function decideFlagContent(text: string): Promise<boolean> {
  if (!HF_TOKEN) {
    console.warn("No Hugging Face token found, skipping decideFlagContent");
    return false;
  }

  try {
    const result = await hf.textClassification({
      model: "unitary/toxic-bert",
      inputs: text,
    });

    // @huggingface/inference can return a flat array or a nested array depending on the model output
    const resultsArray = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
    const toxicScore = resultsArray.find((r: any) => r.label === "toxic")?.score || 0;
    return toxicScore > 0.8; // Flag if toxicity > 80%
  } catch (error) {
    console.error("Error in decideFlagContent:", error);
  }
  return false;
}

/**
 * Report Reasoning:
 * Calls a text-generation model to provide detailed reasoning for flagged content.
 */
export async function analyzeReportReasoning(text: string): Promise<{ aiToxicityScore: number, aiVerdict: string, aiExplanation: string } | null> {
  if (!HF_TOKEN) {
    console.warn("No Hugging Face token found, skipping analyzeReportReasoning");
    return null;
  }

  const prompt = `[INST] Analyze the following text for toxicity and inappropriate content. Respond ONLY in valid JSON format with three keys: "aiToxicityScore" (float between 0 and 1), "aiVerdict" (string, one of: "SAFE", "TOXIC", "SPAM"), and "aiExplanation" (a short 1-2 sentence explanation). Text: "${text}" [/INST]`;

  try {
    const result = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150
    });

    if (result.choices && result.choices.length > 0) {
      const generatedText = result.choices[0].message.content?.trim() || "";
      // Attempt to extract and parse JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          aiToxicityScore: typeof parsed.aiToxicityScore === 'number' ? parsed.aiToxicityScore : 0.5,
          aiVerdict: parsed.aiVerdict || "SAFE",
          aiExplanation: parsed.aiExplanation || "No explanation provided"
        };
      }
    }
  } catch (error) {
    console.error("Error in analyzeReportReasoning:", error);
  }

  return null;
}

/**
 * Match Thread Sentiment Helper:
 * Fetches recent comments for a match thread, groups by fan affiliation, 
 * computes sentiment, and updates the thread.
 */
export async function calculateMatchSentiment(threadId: string): Promise<void> {
  if (!HF_TOKEN) {
    console.warn("No Hugging Face token found, skipping calculateMatchSentiment");
    return;
  }

  // 1. Fetch thread and its match
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { match: true }
  });
  if (!thread) return;

  // 2. Fetch posts
  const posts = await prisma.post.findMany({
    where: { threadId },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit to recent 100 posts to control payload size
  });

  if (posts.length === 0) return;

  const homeTeamId = thread.match?.homeTeamId || thread.teamId || null;
  const awayTeamId = thread.match?.awayTeamId || null;

  const homePosts: string[] = [];
  const awayPosts: string[] = [];
  const neutralPosts: string[] = [];

  for (const post of posts) {
    const userTeamId = post.author?.favoriteTeamId;
    if (homeTeamId && userTeamId === homeTeamId) {
      homePosts.push(post.content);
    } else if (awayTeamId && userTeamId === awayTeamId) {
      awayPosts.push(post.content);
    } else {
      neutralPosts.push(post.content);
    }
  }

  // Local helper to ask HF for sentiment of a batch of text
  const analyzeBatch = async (texts: string[]): Promise<string> => {
    if (texts.length === 0) return "MIXED";
    // Truncate to avoid exceeding max input lengths
    const combinedText = texts.join(" | ").substring(0, 1000);
    const prompt = `[INST] Analyze the overall sentiment of these sports fans' comments. Respond with EXACTLY ONE WORD from the following options: POSITIVE, NEGATIVE, MIXED. Comments: "${combinedText}" [/INST]`;

    try {
      const result = await hf.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10
      });

      if (result.choices && result.choices.length > 0) {
        const generatedText = (result.choices[0].message.content || "").trim().toUpperCase();
        if (generatedText.includes("POSITIVE")) return "POSITIVE";
        if (generatedText.includes("NEGATIVE")) return "NEGATIVE";
      }
    } catch (e) {
      console.error(e);
    }
    return "MIXED"; // default fallback
  };

  const sentimentHome = await analyzeBatch(homePosts);
  const sentimentAway = await analyzeBatch(awayPosts);
  const sentimentTotal = await analyzeBatch([...homePosts, ...awayPosts, ...neutralPosts]);

  // 3. Update thread with new sentiment
  await prisma.thread.update({
    where: { id: threadId },
    data: {
      sentimentHome,
      sentimentAway,
      sentimentTotal
    }
  });
}

/**
 * Translation Helper:
 * Translates a given text into the specified language (default: English) using Llama 3.
 */
export async function translateText(text: string, targetLanguage: string = "English"): Promise<string | null> {
  if (!HF_TOKEN) {
    console.warn("No Hugging Face token found, skipping translateText");
    return null;
  }

  const prompt = `[INST] Translate the following text into ${targetLanguage}. Respond ONLY with the translated ${targetLanguage} text. Do not include any extra commentary, explanations, quotes, or notes. If the text is already in ${targetLanguage}, just return the original text EXACTLY as is. Text: "${text}" [/INST]`;

  try {
    const result = await hf.chatCompletion({
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content?.trim() || null;
    }
  } catch (error) {
    console.error("Error in translateText:", error);
  }

  return null;
}

