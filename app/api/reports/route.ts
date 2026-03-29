import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromRequest } from "../../../lib/auth";
import { analyzeReportReasoning } from "../../../lib/ai";

// POST /api/reports - Submit a report for a post/thread (User) - payload includes resourceId, resourceType, reason
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (user == null) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, resourceType, reason } = body ?? {};
    if (!resourceId || !resourceType || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let contentToAnalyze = "";

    // validate type and existence
    if (resourceType === "THREAD") {
      const thread = await prisma.thread.findUnique({ where: { id: resourceId } });
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }
      contentToAnalyze = thread.content;
    } else if (resourceType === "POST") {
      const post = await prisma.post.findUnique({ where: { id: resourceId } });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      contentToAnalyze = post.content;
    } else {
      return NextResponse.json({ error: "Invalid resourceType" }, { status: 400 });
    }

    // prevent duplicate reporting
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        status: "PENDING",
        threadId: resourceType === "THREAD" ? resourceId : null,
        postId: resourceType === "POST" ? resourceId : null,
      },
    });
    if (existingReport) {
      return NextResponse.json({ error: "Report already exists" }, { status: 400 });
    }

    // simple create report
    const data: any = {
      reporterId: user.id,
      reason,
    };
    if (resourceType === "THREAD") data.threadId = resourceId;
    else data.postId = resourceId;

    const report = await prisma.report.create({ data });

    // Async AI moderation evaluation (fire-and-forget)
    if (contentToAnalyze) {
      analyzeReportReasoning(contentToAnalyze).then(async (aiResult) => {
        if (aiResult) {
          await prisma.report.update({
            where: { id: report.id },
            data: {
              aiToxicityScore: aiResult.aiToxicityScore,
              aiVerdict: aiResult.aiVerdict,
              aiExplanation: aiResult.aiExplanation,
            },
          });
        }
      }).catch(err => console.error("Error during async AI report evaluation:", err));
    }

    return NextResponse.json({ message: "Report submitted", reportId: report.id }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

// GET /api/reports - View queue of reported items (Admin) - aggregated and sorted by report count
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (user == null || user.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const reports = await prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: { select: { id: true, username: true } },
        thread: { select: { id: true, title: true, content: true } },
        post: { select: { id: true, content: true, threadId: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const map: Record<
      string,
      { content: any; reports: typeof reports }
    > = {};

    for (const r of reports) {
      const key = r.threadId ? `thread:${r.threadId}` : `post:${r.postId}`;
      if (!map[key]) {
        map[key] = {
          content: r.thread
            ? { type: "THREAD", ...r.thread }
            : { type: "POST", ...r.post },
          reports: [],
        };
      }
      map[key].reports.push(r);
    }

    const verdictPriority: Record<string, number> = {
      TOXIC: 3,
      SPAM: 2,
      SAFE: 1,
    };

    const result = Object.values(map).sort((a, b) => {
      // 1. Sort by highest AI toxicity score across reports (descending)
      const maxToxA = Math.max(...a.reports.map(r => r.aiToxicityScore ?? 0));
      const maxToxB = Math.max(...b.reports.map(r => r.aiToxicityScore ?? 0));
      if (maxToxB !== maxToxA) return maxToxB - maxToxA;

      // 2. Sort by AI verdict priority (descending)
      const bestVerdictA = Math.max(...a.reports.map(r => verdictPriority[r.aiVerdict ?? ""] ?? 0));
      const bestVerdictB = Math.max(...b.reports.map(r => verdictPriority[r.aiVerdict ?? ""] ?? 0));
      if (bestVerdictB !== bestVerdictA) return bestVerdictB - bestVerdictA;

      // 3. Sort by report count (descending)
      return b.reports.length - a.reports.length;
    });

    const totalItems = result.length;
    const skip = (page - 1) * limit;
    const paginatedResult = result.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedResult,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

