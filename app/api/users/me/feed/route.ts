import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

// GET /api/users/me/feed - Get personalized activity feed (grouped meaningfully) (User)
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = currentUser.id;

    // Fetch user details including follows and favorite team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        favoriteTeamId: true,
        following: {
          select: { followingId: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followingIds = user.following.map(f => f.followingId);
    const favoriteTeamId = user.favoriteTeamId;

    // Date threshold (e.g. 14 days ago)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const feedItems: any[] = [];
    const seenThreadIds = new Set<string>();

    // 1. Matches for favorite team
    if (favoriteTeamId) {
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: favoriteTeamId },
            { awayTeamId: favoriteTeamId }
          ],
          utcDate: {
            gte: twoWeeksAgo
          },
          status: {
            in: ["FINISHED", "LIVE", "IN_PLAY", "PAUSED"] // football-data API statuses
          }
        },
        include: {
          homeTeam: { select: { id: true, name: true, crest: true, shortName: true, tla: true } },
          awayTeam: { select: { id: true, name: true, crest: true, shortName: true, tla: true } }
        },
        orderBy: { utcDate: 'desc' },
        take: 10
      });

      recentMatches.forEach(match => {
        feedItems.push({
          type: "MATCH_UPDATE",
          timestamp: match.utcDate,
          data: match
        });
      });

      // 1b. Threads in the favorite team's forum
      const teamThreads = await prisma.thread.findMany({
        where: {
          teamId: favoriteTeamId,
          createdAt: { gte: twoWeeksAgo },
          isHidden: false,
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          team: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      teamThreads.forEach(thread => {
        seenThreadIds.add(thread.id);
        feedItems.push({
          type: "NEW_THREAD",
          timestamp: thread.createdAt,
          data: thread,
          context: "favorite_team"
        });
      });
    }

    // 2. Threads created by users we follow
    if (followingIds.length > 0) {
      const followedThreads = await prisma.thread.findMany({
        where: {
          authorId: { in: followingIds },
          createdAt: { gte: twoWeeksAgo },
          isHidden: false,
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          team: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      followedThreads.forEach(thread => {
        if (!seenThreadIds.has(thread.id)) {
          seenThreadIds.add(thread.id);
          feedItems.push({
            type: "NEW_THREAD",
            timestamp: thread.createdAt,
            data: thread,
            context: "followed_user"
          });
        }
      });
    }

    // 3. Comments/Posts
    // - From users we follow
    // - Or replies to threads created by the current user
    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: twoWeeksAgo },
        isHidden: false,
        OR: [
          { authorId: { in: followingIds } },
          {
            thread: { authorId: userId },
            authorId: { not: userId } // Don't notify about my own replies
          }
        ]
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        thread: { select: { id: true, title: true, teamId: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    // Group posts by threadId
    const postGroups = new Map();
    for (const post of posts) {
      if (!postGroups.has(post.threadId)) {
        postGroups.set(post.threadId, {
          threadId: post.threadId,
          threadTitle: post.thread?.title,
          latestTimestamp: post.createdAt, // Since ordered desc, the first we see is the newest
          replyCount: 0,
          uniqueActors: new Map()
        });
      }
      const group = postGroups.get(post.threadId);
      group.replyCount += 1;

      // Keep track of unique actors (up to 3 for preview, or all)
      if (!group.uniqueActors.has(post.authorId)) {
        group.uniqueActors.set(post.authorId, post.author);
      }
    }

    postGroups.forEach(group => {
      feedItems.push({
        type: "THREAD_REPLIES",
        timestamp: group.latestTimestamp,
        data: {
          threadId: group.threadId,
          threadTitle: group.threadTitle,
          replyCount: group.replyCount,
          actors: Array.from(group.uniqueActors.values())
        }
      });
    });

    // Sort feedItems descending by timestamp
    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const totalItems = feedItems.length;
    const skip = (page - 1) * limit;
    const paginatedFeed = feedItems.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedFeed,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error creating feed:", error);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
