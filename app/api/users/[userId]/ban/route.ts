import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

// POST /api/users/{userId}/ban - Ban a user based on reports (Admin)
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { userId } = await params;

    // make sure the target user exists
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // if already banned, nothing to do
    if (target.isBanned) {
      return NextResponse.json({ message: "User is already banned" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    return NextResponse.json({ message: "User banned successfully" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to ban user" }, { status: 500 });
  }
}
