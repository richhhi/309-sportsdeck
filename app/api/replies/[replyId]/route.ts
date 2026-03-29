import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { decideFlagContent } from "@/lib/ai";
import { invalidateCachePattern } from "@/lib/redis";

// PUT /api/replies/{replyId} - Edit a reply (User - Author only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  try {
    const { replyId } = await params;
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required to update" },
        { status: 400 }
      );
    }

    // Get current post
    const post = await prisma.post.findUnique({
      where: { id: replyId },
      include: { thread: true },
    });

    if (!post || post.isHidden) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Ensure parent thread isn't hidden/locked
    if (post.thread.isHidden || post.thread.isLocked) {
      return NextResponse.json({ error: "Cannot edit reply in a hidden/locked thread" }, { status: 403 });
    }

    // Check ownership
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transaction to save old version and update post
    const updatedPost = await prisma.$transaction(async (tx) => {
      await tx.postVersion.create({
        data: {
          postId: post.id,
          content: post.content,
        },
      });

      return tx.post.update({
        where: { id: post.id },
        data: {
          content: content,
        },
      });
    });

    Promise.resolve().then(async () => {
      try {
        // 1. Content Moderation
        const isFlagged = await decideFlagContent(content);
        if (isFlagged) {
          await prisma.post.update({
            where: { id: post.id },
            data: { isAiFlagged: true },
          });
        } else {
          await prisma.post.update({
            where: { id: post.id },
            data: { isAiFlagged: false },
          });
        }
      } catch (err) {
        console.error("Error in background moderation job:", err);
      }
    });

    await invalidateCachePattern(`threads:detail:${post.thread.id}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("PUT /api/replies/[replyId] error:", error);
    return NextResponse.json(
      { error: "Failed to update reply" },
      { status: 500 }
    );
  }
}

// DELETE /api/replies/{replyId} - Delete a reply (User - Author only / Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  try {
    const { replyId } = await params;
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: replyId },
    });

    if (!post || post.isHidden) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Check ownership
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.post.update({
      where: { id: post.id },
      data: { isHidden: true },
    });

    await invalidateCachePattern(`threads:detail:${post.threadId}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json({ success: true, message: "Reply deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/replies/[replyId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
