import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCachedData, setCachedData } from "../../../lib/redis";

// GET /api/standings - Get league tables/standings (Visitor)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = `standings:list:${searchParams.toString()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("hit");
      return NextResponse.json(cached);
    }
    console.log("miss");

    const seasonId = searchParams.get("seasonId");
    const stage = searchParams.get("stage");
    const type = searchParams.get("type");
    const group = searchParams.get("group");

    // Build the query
    const where: any = {};
    if (seasonId) where.seasonId = seasonId;
    if (stage) where.stage = stage;
    if (type) where.type = type;
    if (group) where.group = group;

    const standings = await prisma.standing.findMany({
      where,
      include: {
        teamStandings: {
          orderBy: {
            position: 'asc',
          },
          include: {
            team: true,
          },
        },
      },
      orderBy: [
        { seasonId: 'desc' },
        { stage: 'asc' },
        { type: 'asc' },
        { group: 'asc' },
      ],
    });

    await setCachedData(cacheKey, standings, 60);
    return NextResponse.json(standings);
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
