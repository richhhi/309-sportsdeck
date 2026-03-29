import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

// GET /api/users/me - Get currently logged-in user's profile (User)
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (currentUser == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const id = currentUser.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, avatarUrl: true, favoriteTeamId: true, role: true, authProvider: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PATCH /api/users/me - Edit profile (username, favorite team) (User)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (currentUser == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const id = currentUser.id;
    const body = await request.json();
    const { username, favoriteTeamId } = body ?? {};

    if (favoriteTeamId !== undefined && favoriteTeamId !== null) {
      const team = await prisma.team.findUnique({ where: { id: favoriteTeamId } });
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      select: { id: true, email: true, username: true, avatarUrl: true, favoriteTeamId: true, role: true, authProvider: true },
      data: {
        username,
        favoriteTeamId,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
