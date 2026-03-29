import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";
import { getCachedData, setCachedData, invalidateCachePattern } from "../../../../lib/redis";

// GET /api/threads/{threadId} - View a specific thread and its main post (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const { threadId } = await params;

    const cacheKey = `threads:detail:${threadId}:${searchParams.toString()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("hit");
      return NextResponse.json(cached);
    }
    console.log("miss");

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
        tags: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        polls: {
          include: {
            author: { select: { id: true, username: true } },
            options: { include: { votes: true } },
            votes: true,
            versions: { orderBy: { createdAt: 'desc' } },
          },
        },
        posts: {
          where: { isHidden: false },
          include: {
            author: {
              select: { id: true, username: true, avatarUrl: true, role: true },
            },
            versions: {
              orderBy: { createdAt: 'desc' }
            },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        },
        _count: {
          select: { posts: { where: { isHidden: false } } },
        },
      },
    });

    if (!thread || thread.isHidden) {
      // NOTE: We hide deleted threads from visitors. If we want admins to see them,
      // we would need auth logic here.
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    await setCachedData(cacheKey, thread, 60);

    return NextResponse.json(thread);
  } catch (error) {
    console.error("GET /api/threads/[threadId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

// PUT /api/threads/{threadId} - Edit thread's main content/title (User - Author only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await request.json();
    if (!title && !content) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    // Get current thread to verify ownership and fetch current state for versioning
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.isHidden) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Only allow author (or Admin if we decide to let admins edit)
    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform the update within a transaction to ensure version history is saved
    const updatedThread = await prisma.$transaction(async (tx) => {
      // 1. Create a version record with the OLD data
      await tx.threadVersion.create({
        data: {
          threadId: thread.id,
          title: thread.title,
          content: thread.content,
        },
      });

      // 2. Update the thread with NEW data
      return tx.thread.update({
        where: { id: thread.id },
        data: {
          title: title ?? thread.title,
          content: content ?? thread.content,
        },
        include: {
          tags: true,
        },
      });
    });

    await invalidateCachePattern(`threads:detail:${threadId}:*`);
    await invalidateCachePattern('threads:list:*');

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error("PUT /api/threads/[threadId] error:", error);
    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    );
  }
}

// DELETE /api/threads/{threadId} - Delete a thread (User - Author only / Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.isHidden) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Verify ownership or ADMIN role
    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.thread.update({
      where: { id: thread.id },
      data: { isHidden: true },
    });

    await invalidateCachePattern(`threads:detail:${threadId}:*`);
    await invalidateCachePattern('threads:list:*');

    return NextResponse.json({ success: true, message: "Thread deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/threads/[threadId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
}
