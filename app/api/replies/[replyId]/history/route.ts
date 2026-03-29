import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/replies/{replyId}/history - View previous versions of a reply (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  try {
    const { replyId } = await params;
    // First verify the post exists and isn't hidden
    const post = await prisma.post.findUnique({
      where: { id: replyId },
      include: {
        thread: true,
      }
    });

    if (!post || post.isHidden || post.thread.isHidden) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Fetch the version history
    const history = await prisma.postVersion.findMany({
      where: { postId: replyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/replies/[replyId]/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reply history" },
      { status: 500 }
    );
  }
}
