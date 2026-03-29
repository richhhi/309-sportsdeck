import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET /api/tags - Get a list of all tags currently in the database
export async function GET() {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(tags);
    } catch (error) {
        console.error("GET /api/tags error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tags" },
            { status: 500 }
        );
    }
}
