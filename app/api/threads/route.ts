import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { decideFlagContent } from "../../../lib/ai";
import { getCachedData, setCachedData, invalidateCachePattern } from "../../../lib/redis";

// GET /api/threads - Browse and search threads (Visitor) - supports query params (q, teamId, tags, etc)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cacheKey = `threads:list:${searchParams.toString()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("hit");
      return NextResponse.json(cached);
    }
    console.log("miss");

    const titleParam = searchParams.get("title") || searchParams.get("q"); // fallback to q if any old link exists
    const teamId = searchParams.get("teamId");
    const authorId = searchParams.get("authorId");
    const tagsParam = searchParams.get("tags");
    const authorParam = searchParams.get("author");
    const teamParam = searchParams.get("team");

    // Build the query
    const whereClause: any = { isHidden: false };

    if (titleParam) {
      whereClause.title = { contains: titleParam, mode: "insensitive" };
    }
    if (authorParam) {
      whereClause.author = { username: { contains: authorParam, mode: "insensitive" } };
    }
    if (teamParam) {
      whereClause.team = { name: { contains: teamParam, mode: "insensitive" } };
    }
    if (teamId) {
      whereClause.teamId = teamId;
    }
    if (authorId) {
      whereClause.authorId = authorId;
    }
    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim());
      whereClause.tags = {
        some: {
          name: { in: tags },
        },
      };
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          team: true,
          match: { select: { utcDate: true } },
          tags: true,
          _count: {
            select: { posts: { where: { isHidden: false } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.thread.count({ where: whereClause })
    ]);

    const responseData = {
      data: threads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    await setCachedData(cacheKey, responseData, 60);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/threads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

// POST /api/threads - Create a new discussion thread (User)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check if user is banned
    const isBanned = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (isBanned?.isBanned) {
      return NextResponse.json({ error: "User is banned" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, teamId, tags, poll } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Prepare tags if provided
    const tagsToConnect = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const trimmedName = tagName.trim();
        if (trimmedName) {
          tagsToConnect.push({
            where: { name: trimmedName },
            create: { name: trimmedName },
          });
        }
      }
    }

    const nextThreadId = await prisma.thread.create({
      data: {
        title,
        content,
        authorId: user.id,
        teamId: teamId || null,
        tags: {
          connectOrCreate: tagsToConnect,
        },
        ...(poll && poll.question && poll.options ? {
          polls: {
            create: {
              question: poll.question,
              authorId: user.id,
              deadline: new Date(poll.deadline),
              options: {
                create: poll.options.map((opt: string) => ({ text: opt })),
              },
            },
          },
        } : {}),
      },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        tags: true,
      },
    });

    // Run AI moderation check asynchronously
    Promise.resolve().then(async () => {
      try {
        const textToCheck = `${title}\n\n${content}`;
        const isFlagged = await decideFlagContent(textToCheck);
        if (isFlagged) {
          await prisma.thread.update({
            where: { id: nextThreadId.id },
            data: { isAiFlagged: true },
          });
        }
      } catch (err) {
        console.error("Background AI moderation failed:", err);
      }
    });

    await invalidateCachePattern('threads:list:*');

    return NextResponse.json(nextThreadId, { status: 201 });
  } catch (error) {
    console.error("POST /api/threads error:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
