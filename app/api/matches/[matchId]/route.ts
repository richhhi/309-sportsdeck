import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET /api/matches/{matchId} - Get details for a specific match (Visitor)
export async function GET(request: Request, props: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await props.params;

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        matchday: true,
        thread: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
            tags: true,
            posts: { where: { isHidden: false } },
          }
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
