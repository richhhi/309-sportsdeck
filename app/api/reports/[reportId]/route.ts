import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromRequest } from "../../../../lib/auth";

// PATCH /api/reports/{reportId} - Resolve a report (Admin)
// body expects { status: "APPROVED" | "DISMISSED" }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { reportId } = await params;
    const body = await request.json();
    const status: string | undefined = body?.status;
    if (!status || (status !== "APPROVED" && status !== "DISMISSED")) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "PENDING") {
      return NextResponse.json({ error: "Report already processed" }, { status: 400 });
    }

    // determine target content
    const threadId = report.threadId;
    const postId = report.postId;

    // update matching pending reports
    const whereClause: any = { status: "PENDING" };
    if (threadId) whereClause.threadId = threadId;
    if (postId) whereClause.postId = postId;

    await prisma.report.updateMany({ where: whereClause, data: { status } });

    if (status === "APPROVED") {
      // hide the underlying content
      if (threadId) {
        await prisma.thread.update({
          where: { id: threadId },
          data: { isHidden: true, isLocked: true },
        });
      }
      if (postId) {
        await prisma.post.update({
          where: { id: postId },
          data: { isHidden: true },
        });
      }
    }

    return NextResponse.json({ message: "Report(s) processed" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
  }
}
