import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/threads/{threadId}/history - View previous versions of a thread's main post (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await params;
        // First verify the thread exists and isn't hidden
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
        });

        if (!thread || thread.isHidden) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        // Fetch the version history
        const history = await prisma.threadVersion.findMany({
            where: { threadId: threadId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("GET /api/threads/[threadId]/history error:", error);
        return NextResponse.json(
            { error: "Failed to fetch thread history" },
            { status: 500 }
        );
    }
}
