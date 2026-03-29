import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";
import { decideFlagContent, calculateMatchSentiment } from "../../../../../lib/ai";
import { invalidateCachePattern } from "../../../../../lib/redis";

// GET /api/threads/{threadId}/replies - Get replies for a specific thread (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const replies = await prisma.post.findMany({
      where: {
        threadId: threadId,
        isHidden: false,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error("GET /api/threads/[threadId]/replies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}

// POST /api/threads/{threadId}/replies - Post a reply to a thread (User)
export async function POST(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check if user is banned
    const isBanned = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (isBanned?.isBanned) {
      return NextResponse.json({ error: "User is banned" }, { status: 403 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const { threadId } = await params;

    // Ensure thread exists and is not hidden
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.isHidden || thread.isLocked) {
      return NextResponse.json(
        { error: "Thread not found or is locked/hidden" },
        { status: 403 }
      );
    }

    const reply = await prisma.post.create({
      data: {
        threadId: thread.id,
        authorId: user.id,
        content: content,
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
      },
    });

    // Run AI checks asynchronously
    Promise.resolve().then(async () => {
      try {
        // 1. Content Moderation
        const isFlagged = await decideFlagContent(content);
        if (isFlagged) {
          await prisma.post.update({
            where: { id: reply.id },
            data: { isAiFlagged: true },
          });
        }

        // 2. Match Sentiment Analysis (every N posts)
        const N = 3;
        const postCount = await prisma.post.count({ where: { threadId: thread.id } });
        if (postCount % N === 0) {
          await calculateMatchSentiment(thread.id);
        }
      } catch (err) {
        console.error("Background AI tasks failed:", err);
      }
    });

    await invalidateCachePattern(`threads:detail:${thread.id}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("POST /api/threads/[threadId]/replies error:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
