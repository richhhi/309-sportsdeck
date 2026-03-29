import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromRequest } from "../../../../../../lib/auth";

// DELETE /api/users/me/followers/{followerId} - Remove someone following you (User)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ followerId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const currentUserId = user.id;
    const { followerId } = await params;

    // Cannot remove yourself as a follower
    if (currentUserId === followerId) {
      return NextResponse.json(
        { error: "Invalid operation" },
        { status: 400 }
      );
    }

    // Verify the follower exists
    const followerUser = await prisma.user.findUnique({ where: { id: followerId } });
    if (!followerUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the follow relationship (followerId is the one following, currentUserId is being followed)
    const result = await prisma.follows.delete({
      where: { followerId_followingId: { followerId, followingId: currentUserId } },
    });

    return NextResponse.json({ message: "Follower removed successfully" }, { status: 200 });
  } catch (err) {
    // Prisma throws PrismaClientKnownRequestError when record not found
    if ((err as any).code === "P2025") {
      return NextResponse.json(
        { error: "This user is not following you" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to remove follower" }, { status: 500 });
  }
}
