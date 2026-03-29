import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/users/{userId}/posts - Get recent posts/comments by user for profile page (Visitor)
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    // ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const items = await prisma.$queryRaw<any[]>`
      SELECT id, title, content, "createdAt", "updatedAt", "isHidden", 'thread' as type, null as "threadId"
      FROM "Thread"
      WHERE "authorId" = ${userId}
      UNION ALL
      SELECT id, null as title, content, "createdAt", "updatedAt", "isHidden", 'post' as type, "threadId"
      FROM "Post"
      WHERE "authorId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const totalQuery = await prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT COUNT(*) FROM "Thread" WHERE "authorId" = ${userId}) + 
        (SELECT COUNT(*) FROM "Post" WHERE "authorId" = ${userId}) as count
    `;

    // Postgres COUNT returns BigInt, so we convert it to Number safely
    const totalItems = Number(totalQuery[0]?.count || 0);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user posts" }, { status: 500 });
  }
}
