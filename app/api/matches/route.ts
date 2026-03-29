import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCachedData, setCachedData } from "../../../lib/redis";

// GET /api/matches - Get list of matches (Visitor) - supports filtering with query params (stage, status, etc)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = `matches:list:${searchParams.toString()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("hit");
      return NextResponse.json(cached);
    }
    console.log("miss");

    const status = searchParams.get("status");
    const matchdayId = searchParams.get("matchdayId");
    const stage = searchParams.get("stage");
    const date = searchParams.get("date");
    const timeframe = searchParams.get("timeframe");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;
    const orderBy = searchParams.get("orderBy") || "asc";

    const where: any = {};
    if (status) where.status = status;
    if (matchdayId) where.matchdayId = matchdayId;
    if (stage) where.stage = stage;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    if (date) {
      // Parse the 'YYYY-MM-DD' date and query the entire UTC day
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      // validate date parsing
      if (!isNaN(startOfDay.getTime())) {
        where.utcDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    } else if (timeframe === "TODAY") {
      where.utcDate = { gte: todayStart, lte: todayEnd };
    } else if (timeframe === "UPCOMING") {
      where.utcDate = { gt: todayEnd };
    } else if (timeframe === "PAST") {
      where.utcDate = { lt: todayStart };
    }

    const [total, matches] = await Promise.all([
      prisma.match.count({ where }),
      prisma.match.findMany({
        where,
        orderBy: {
          utcDate: orderBy as "asc" | "desc",
        },
        skip,
        take: limit,
        include: {
          homeTeam: true,
          awayTeam: true,
          matchday: true,
        },
      })
    ]);

    const totalPages = Math.ceil(total / limit);
    const result = { data: matches, total, page, limit, totalPages };

    await setCachedData(cacheKey, result, 60);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
