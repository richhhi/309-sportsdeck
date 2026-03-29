import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

/**
 * GET /api/moderation/flagged
 * Retrieves all Threads and Posts that have been flagged by the AI (isAiFlagged = true).
 * 
 * Query Parameters:
 * - type: 'threads' | 'posts' | 'all' (default: 'all')
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    let flaggedThreads: any[] = [];
    let totalThreads = 0;
    let flaggedPosts: any[] = [];
    let totalPosts = 0;

    if (type === "all" || type === "threads") {
      const [threadsRes, countThreads] = await Promise.all([
        prisma.thread.findMany({
          where: { isAiFlagged: true, isHidden: false },
          include: { author: { select: { id: true, username: true } } },
          take: limit,
          skip: skip,
          orderBy: { createdAt: "desc" },
        }),
        prisma.thread.count({ where: { isAiFlagged: true, isHidden: false } })
      ]);
      flaggedThreads = threadsRes;
      totalThreads = countThreads;
    }

    if (type === "all" || type === "posts") {
      const [postsRes, countPosts] = await Promise.all([
        prisma.post.findMany({
          where: { isAiFlagged: true, isHidden: false },
          include: { author: { select: { id: true, username: true } }, thread: { select: { id: true, title: true } } },
          take: limit,
          skip: skip,
          orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({ where: { isAiFlagged: true, isHidden: false } })
      ]);
      flaggedPosts = postsRes;
      totalPosts = countPosts;
    }

    const response: any = {};
    if (type === "all" || type === "threads") {
      response.threads = {
        data: flaggedThreads,
        pagination: { page, limit, totalItems: totalThreads, totalPages: Math.ceil(totalThreads / limit) }
      };
    }
    if (type === "all" || type === "posts") {
      response.posts = {
        data: flaggedPosts,
        pagination: { page, limit, totalItems: totalPosts, totalPages: Math.ceil(totalPosts / limit) }
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching AI flagged content:", error);
    return NextResponse.json(
      { error: "Internal server error fetching flagged content." },
      { status: 500 }
    );
  }
}
