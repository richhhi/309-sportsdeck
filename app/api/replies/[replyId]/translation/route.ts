import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { translateText } from "../../../../../lib/ai";

// GET /api/replies/{replyId}/translation - Translate a specific post/comment - pass target language in query (?lang=en)
export async function GET(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  try {
    const { replyId } = await params;

    // Extract target language from query params if needed, default to English.
    const searchParams = request.nextUrl.searchParams;
    let targetLang = searchParams.get("lang") || "English";
    if (targetLang.toLowerCase() === "en") targetLang = "English";

    const post = await prisma.post.findUnique({
      where: { id: replyId },
    });

    if (!post) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    if (post.isHidden) {
      return NextResponse.json({ error: "Cannot translate hidden content" }, { status: 403 });
    }

    const translatedText = await translateText(post.content, targetLang);

    if (!translatedText) {
      return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }

    return NextResponse.json({ translation: translatedText }, { status: 200 });
  } catch (error) {
    console.error("Error in translation route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
