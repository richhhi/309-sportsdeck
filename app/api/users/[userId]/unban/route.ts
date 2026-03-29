import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../lib/auth";

// POST /api/users/{userId}/unban - Unban a user manually (Admin)
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { userId } = await params;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!target.isBanned) {
      return NextResponse.json({ message: "User is not banned" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    return NextResponse.json({ message: "User unbanned successfully" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to unban user" }, { status: 500 });
  }
}
