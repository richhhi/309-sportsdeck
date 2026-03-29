import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/users/{userId}/activity - Get user's activity chart data over time (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    // make sure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // fetch raw timestamps
    const [threads, posts] = await Promise.all([
      prisma.thread.findMany({
        where: { authorId: userId },
        select: { createdAt: true },
      }),
      prisma.post.findMany({
        where: { authorId: userId },
        select: { createdAt: true },
      }),
    ]);

    type Counts = { threadCount: number; postCount: number };
    const map: Record<string, Counts> = {};

    function record(date: string, kind: "thread" | "post") {
      if (!map[date]) {
        map[date] = { threadCount: 0, postCount: 0 };
      }
      if (kind === "thread") map[date].threadCount++;
      else map[date].postCount++;
    }

    threads.forEach((t) => {
      const d = t.createdAt.toISOString().split("T")[0];
      record(d, "thread");
    });
    posts.forEach((p) => {
      const d = p.createdAt.toISOString().split("T")[0];
      record(d, "post");
    });

    // convert map to array, sorted ascending by date
    const result = Object.entries(map)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
