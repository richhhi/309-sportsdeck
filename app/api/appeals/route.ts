import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";

// POST /api/appeals - Submit a request to be unbanned (Banned User)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ensure the requester is actually banned
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!dbUser.isBanned) {
      return NextResponse.json({ error: "You are not banned" }, { status: 400 });
    }

    const body = await request.json();
    const message: string | undefined = body?.message;
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Appeal message required" }, { status: 400 });
    }

    // prevent duplicate pending appeals
    const existing = await prisma.banAppeal.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "Appeal already pending" }, { status: 400 });
    }

    await prisma.banAppeal.create({
      data: { userId: user.id, message },
    });

    return NextResponse.json({ message: "Appeal submitted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit appeal" }, { status: 500 });
  }
}

// GET /api/appeals - View queue of unban requests (Admin)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [appeals, totalItems] = await Promise.all([
      prisma.banAppeal.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.banAppeal.count({
        where: { status: "PENDING" },
      }),
    ]);

    return NextResponse.json({
      data: appeals,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load appeals" }, { status: 500 });
  }
}
