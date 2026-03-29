import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

// POST /api/users/{userId}/followers - Follow a user (User)
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const currentUserId = user.id;
    const { userId } = await params;

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (currentUser?.isBanned) {
      return NextResponse.json({ error: "you are banned" }, { status: 403 });
    }

    // Cannot follow yourself
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existing = await prisma.follows.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create follow relationship
    await prisma.follows.create({
      data: { followerId: currentUserId, followingId: userId },
    });

    return NextResponse.json({ message: "User followed successfully" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// DELETE /api/users/{userId}/followers - Unfollow a user (User)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const currentUserId = user.id;
    const { userId } = await params;

    // Delete follow relationship
    const result = await prisma.follows.delete({
      where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "User unfollowed successfully" }, { status: 200 });
  } catch (err) {
    // Prisma throws PrismaClientKnownRequestError when record not found
    if ((err as any).code === "P2025") {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}

// GET /api/users/{userId}/followers - List users following this user (User)
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all followers (users who follow userId)
    const [followers, totalItems] = await Promise.all([
      prisma.follows.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.follows.count({ where: { followingId: userId } }),
    ]);

    return NextResponse.json({
      data: followers,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
}
