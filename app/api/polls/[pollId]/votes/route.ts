import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { invalidateCachePattern } from "../../../../../lib/redis";

// POST /api/polls/{pollId}/votes - Cast a vote in a poll (User)
export async function POST(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pollId } = await params;
    const { pollOptionId } = await request.json();

    if (!pollOptionId) {
      return NextResponse.json({ error: "Missing pollOptionId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Forbidden: Banned users cannot vote" }, { status: 403 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { thread: true, options: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.thread.isLocked) {
      return NextResponse.json({ error: "Cannot vote in a locked thread" }, { status: 403 });
    }

    if (new Date() > poll.deadline) {
      return NextResponse.json({ error: "Poll voting has ended" }, { status: 403 });
    }

    const optionExists = poll.options.some((opt: any) => opt.id === pollOptionId);
    if (!optionExists) {
      return NextResponse.json({ error: "Invalid pollOptionId" }, { status: 400 });
    }

    // Upsert the vote. Prevent double voting but allow changing vote.
    // Unique ID is @@id([pollId, userId])
    const vote = await prisma.pollVote.upsert({
      where: {
        pollId_userId: {
          pollId,
          userId: userPayload.id,
        },
      },
      update: {
        pollOptionId,
      },
      create: {
        pollId,
        userId: userPayload.id,
        pollOptionId,
      },
    });

    await invalidateCachePattern(`threads:detail:${poll.thread.id}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json({ message: "Vote cast successfully", vote });
  } catch (error: any) {
    console.error("Error voting in poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
