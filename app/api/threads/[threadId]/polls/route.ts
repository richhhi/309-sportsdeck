import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { invalidateCachePattern } from "../../../../../lib/redis";

// POST /api/threads/{threadId}/polls - Create a poll within a thread (User)
export async function POST(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Forbidden: Banned users cannot create polls" }, { status: 403 });
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { question, options, deadline } = await request.json();

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "Invalid poll data. Need question and at least 2 options." }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json({ error: "Invalid deadline. Must be a future date." }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: {
        threadId,
        authorId: userPayload.id,
        question,
        deadline: deadlineDate,
        options: {
          create: options.map((opt: string) => ({ text: opt })),
        },
      },
      include: {
        options: true,
      },
    });

    await invalidateCachePattern(`threads:detail:${threadId}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
