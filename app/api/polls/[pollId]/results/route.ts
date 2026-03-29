import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

// GET /api/polls/{pollId}/results - View poll results (User/Guest)
export async function GET(request: NextRequest, props: { params: Promise<{ pollId: string }> }) {
  try {
    const { pollId } = await props.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const results = poll.options.map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      voteCount: opt._count.votes
    }));

    // If a user is logged in, show what they voted for
    const userPayload = getUserFromRequest(request);
    let userVoteValue = null;

    if (userPayload) {
      const userVote = await prisma.pollVote.findUnique({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: userPayload.id
          }
        }
      });
      if (userVote) {
        userVoteValue = userVote.pollOptionId;
      }
    }

    return NextResponse.json({
      pollId: poll.id,
      question: poll.question,
      deadline: poll.deadline,
      results,
      userVote: userVoteValue,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
