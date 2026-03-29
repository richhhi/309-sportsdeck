import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { invalidateCachePattern } from "../../../../lib/redis";

// PUT /api/polls/{pollId} - Edit a poll (User - Author only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pollId } = await params;
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { thread: true, options: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.authorId !== userPayload.id && userPayload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only poll author can edit the poll" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.isBanned) {
      return NextResponse.json({ error: "Forbidden: User is banned" }, { status: 403 });
    }

    const { question, options } = await request.json();

    // Default: extend deadline by 7 days from now on edit
    const newDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedPoll = await prisma.$transaction(async (tx) => {
      // 1. Create a snapshot of the current state
      await tx.pollVersion.create({
        data: {
          pollId: poll.id,
          question: poll.question,
          deadline: poll.deadline,
          options: poll.options.map((o: any) => o.text).join(", "),
        },
      });

      // 2. If options are provided, wipe old ones and create new
      if (options && Array.isArray(options) && options.length >= 2) {
        await tx.pollOption.deleteMany({ where: { pollId } });
        await tx.pollVote.deleteMany({ where: { pollId } }); // Wipe votes

        return tx.poll.update({
          where: { id: pollId },
          data: {
            question: question || poll.question,
            deadline: newDeadline,
            options: {
              create: options.map((opt: string) => ({ text: opt })),
            },
          },
          include: { options: true }
        });
      } else {
        // Just update question and deadline
        return tx.poll.update({
          where: { id: pollId },
          data: {
            question: question || poll.question,
            deadline: newDeadline,
          },
          include: { options: true }
        });
      }
    });

    await invalidateCachePattern(`threads:detail:${poll.threadId}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error("Error updating poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/polls/{pollId} - Delete a poll (User - Author only / Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pollId } = await params;
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { thread: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.authorId !== userPayload.id && userPayload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.poll.delete({
      where: { id: pollId },
    });

    await invalidateCachePattern(`threads:detail:${poll.threadId}:*`);
    await invalidateCachePattern(`threads:list:*`);

    return NextResponse.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
