import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { translateText } from "../../../../../lib/ai";

// GET /api/threads/{threadId}/translation - Translate a main thread post - pass target language in query (?lang=en)
export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;

    const searchParams = request.nextUrl.searchParams;
    let targetLang = searchParams.get("lang") || "English";
    if (targetLang.toLowerCase() === "en") targetLang = "English";

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.isHidden) {
      return NextResponse.json({ error: "Cannot translate hidden content" }, { status: 403 });
    }

    const translatedText = await translateText(thread.content, targetLang);

    if (!translatedText) {
      return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }

    return NextResponse.json({ translation: translatedText }, { status: 200 });
  } catch (error) {
    console.error("Error in translation route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
