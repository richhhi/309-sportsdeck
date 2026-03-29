import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { generateDailyDigest } from "../../../lib/digest";
import { getUserFromRequest } from "../../../lib/auth";
import { getCachedData, setCachedData } from "../../../lib/redis";

// GET /api/digest - Fetch AI-generated daily digest (User) - summarizes matches, standings, and top discussions
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = `digest:daily:${today.toISOString()}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("hit");
      return NextResponse.json(cached);
    }
    console.log("miss");

    let digest = await prisma.dailyDigest.findUnique({
      where: { date: today }
    });

    if (!digest) {
      digest = await generateDailyDigest();
    }

    await setCachedData(cacheKey, digest, 3600); // Cache daily digest for 1 hour
    return NextResponse.json(digest);
  } catch (error) {
    console.error("Error fetching or generating digest:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
