import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

// PATCH /api/appeals/{appealId} - Update status of a ban appeal (Admin)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ appealId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { appealId } = await params;
    const body = await request.json();
    const status: string | undefined = body?.status;
    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const appeal = await prisma.banAppeal.findUnique({ where: { id: appealId } });
    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }

    // if already resolved, we can still update but maybe warn
    if (appeal.status !== "PENDING") {
      return NextResponse.json({ error: "Appeal already processed" }, { status: 400 });
    }

    await prisma.banAppeal.update({
      where: { id: appealId },
      data: { status },
    });

    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: appeal.userId },
        data: { isBanned: false },
      });
    }

    return NextResponse.json({ message: "Appeal status updated" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update appeal" }, { status: 500 });
  }
}
