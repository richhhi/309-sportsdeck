import { prisma } from "@/lib/prisma";
import { InferenceClient } from "@huggingface/inference";

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
const hf = new InferenceClient(HF_TOKEN);

export async function generateDailyDigest() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // 1. Fetch recent matches
  const matches = await prisma.match.findMany({
    where: {
      utcDate: { gte: yesterday },
      status: 'FINISHED',
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    take: 10,
    orderBy: { utcDate: 'desc' },
  });

  // 2. Fetch active threads
  let threads = [];
  try {
    threads = await prisma.thread.findMany({
      where: {
        updatedAt: { gte: yesterday },
      },
      include: {
        team: true,
        _count: { select: { posts: true } },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: 5,
    });
  } catch (e) {
    console.warn("Could not order threads by post count, fetching without order", e);
    threads = await prisma.thread.findMany({
      where: {
        updatedAt: { gte: yesterday },
      },
      include: {
        team: true,
        _count: { select: { posts: true } },
      },
      take: 5,
    });
  }

  // 3. Construct prompt
  const matchSummary = matches
    .map((m) => `${m.homeTeam.name} ${m.homeScore} - ${m.awayScore} ${m.awayTeam.name}`)
    .join("\n");

  const threadSummary = threads
    .map((t) => `- "${t.title}" (${t._count.posts} comments) ${t.team ? `[${t.team.name}]` : ''}`)
    .join("\n");

  const prompt = `[INST] You are an expert sports journalist. Create a short, engaging daily digest summarizing the following recent football events and community discussions. Format the output in Markdown with bullet points or short paragraphs. Be concise.

Recent Matches:
${matchSummary || "No major matches played yesterday."}

Top Community Discussions:
${threadSummary || "No major discussions yesterday."}
[/INST]`;

  let content = "Failed to generate digest.";

  if (HF_TOKEN) {
    try {
      const result = await hf.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      });
      if (result.choices && result.choices.length > 0) {
        content = result.choices[0].message.content || content;
      }
    } catch (error) {
      console.error("Error generating digest via HF API:", error);
    }
  } else {
    console.warn("No Hugging Face token found for digest generation.");
    content = "AI generation is disabled because Hugging Face token is missing.\n\n" +
      "**Scores:**\n" + (matchSummary || "None") + "\n\n" +
      "**Discussions:**\n" + (threadSummary || "None");
  }

  // 4. Save to database
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const digest = await prisma.dailyDigest.upsert({
    where: { date: today },
    update: { content },
    create: { date: today, content },
  });

  return digest;
}
