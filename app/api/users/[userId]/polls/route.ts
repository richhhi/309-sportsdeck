import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/users/{userId}/polls - List polls created by the user (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const polls = await prisma.poll.findMany({
            where: {
                thread: {
                    authorId: userId,
                },
            },
            include: {
                thread: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                        isHidden: true,
                        isLocked: true,
                    },
                },
                options: {
                    include: {
                        _count: {
                            select: { votes: true },
                        },
                    },
                },
                _count: {
                    select: { votes: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Format the results similar to /api/polls/[pollId]/results but structured as a list
        const formattedPolls = polls.map((poll) => ({
            id: poll.id,
            threadId: poll.threadId,
            question: poll.question,
            deadline: poll.deadline,
            createdAt: poll.createdAt,
            thread: poll.thread,
            totalVotes: poll._count.votes,
            options: poll.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                voteCount: opt._count.votes,
            })),
        }));

        return NextResponse.json(formattedPolls);
    } catch (error) {
        console.error("GET /api/users/[userId]/polls error:", error);
        return NextResponse.json(
            { error: "Failed to fetch user's polls" },
            { status: 500 }
        );
    }
}
