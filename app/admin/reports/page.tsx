"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Button } from "../../../components/ui/Button";
import { Pagination } from "../../../components/ui/Pagination";
import apiClient from "../../../lib/api-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ReportItem {
  content: {
    type: "THREAD" | "POST";
    id: string;
    title?: string;
    content?: string;
    threadId?: string;
  };
  reports: {
    id: string;
    reason: string;
    aiToxicityScore: number | null;
    aiVerdict: string | null;
    aiExplanation: string | null;
    reporter: { id: string; username: string };
    createdAt: string;
  }[];
}

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/reports?page=${page}&limit=5`);
        setItems(res.data.data ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user, authLoading, page]);

  const handleResolve = async (reportId: string, status: "APPROVED" | "DISMISSED") => {
    setProcessing(reportId);
    try {
      await apiClient.patch(`/reports/${reportId}`, { status });
      // Remove the resolved group from the list
      setItems((prev) => prev.filter((item) => !item.reports.some((r) => r.id === reportId)));
      toast.success(status === "APPROVED" ? "Report approved — content hidden" : "Report dismissed");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to process report");
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-[var(--sd-text-secondary)]">Loading...</div>;
  if (!user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-red-500">Unauthorized. Admins only.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)] hover:border-[var(--sd-accent)] transition-colors"
          style={{ cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)] tracking-tight">Reported Content</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--sd-text-secondary)]">Loading reports...</div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-8 text-center">
          <p className="text-[var(--sd-text-secondary)]">No pending reports 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const firstReport = item.reports[0];
            const maxToxicity = Math.max(...item.reports.map((r) => r.aiToxicityScore ?? 0));
            const topVerdict = item.reports.find((r) => r.aiVerdict === "TOXIC")?.aiVerdict
              || item.reports.find((r) => r.aiVerdict === "SPAM")?.aiVerdict
              || item.reports[0]?.aiVerdict;

            return (
              <div key={idx} className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl p-5 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                    {item.reports.length} {item.reports.length === 1 ? "Report" : "Reports"}
                  </span>
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-[var(--sd-text-secondary)]/10 text-[var(--sd-text-secondary)]">
                    {item.content.type}
                  </span>
                  {topVerdict && (
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${topVerdict === "TOXIC" ? "bg-red-500/10 text-red-400"
                      : topVerdict === "SPAM" ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-green-500/10 text-green-400"
                      }`}>
                      AI: {topVerdict}
                    </span>
                  )}
                  {maxToxicity > 0 && (
                    <span className="text-xs text-[var(--sd-text-tertiary)]">
                      Toxicity: {(maxToxicity * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Content preview */}
                <div className="bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-lg p-3 cursor-pointer"
                  onClick={() => router.push(item.content.threadId ? `/threads/${item.content.threadId}` : `/threads/${item.content.id}`)}>
                  {item.content.title && (
                    <h4 className="text-sm font-semibold text-[var(--sd-text-primary)] mb-1">{item.content.title}</h4>
                  )}
                  <p className="text-sm text-[var(--sd-text-secondary)] line-clamp-3">
                    {item.content.content || "No content preview available"}
                  </p>
                </div>

                {/* Report reasons */}
                <div className="space-y-1">
                  {item.reports.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-start gap-2 text-xs text-[var(--sd-text-tertiary)]">
                      <span className="font-medium text-[var(--sd-text-secondary)]">{r.reporter.username}:</span>
                      <span className="italic">&quot;{r.reason}&quot;</span>
                    </div>
                  ))}
                  {item.reports.length > 3 && (
                    <p className="text-xs text-[var(--sd-text-tertiary)]">+{item.reports.length - 3} more reports</p>
                  )}
                </div>

                {/* AI Explanation */}
                {firstReport?.aiExplanation && (
                  <div className="text-xs text-[var(--sd-text-tertiary)] bg-[var(--sd-bg-primary)] rounded-lg p-2 border border-[var(--sd-border)]">
                    <span className="font-semibold">AI analysis:</span> {firstReport.aiExplanation}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={processing === firstReport.id}
                    onClick={() => handleResolve(firstReport.id, "APPROVED")}
                  >
                    Approve & Hide
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={processing === firstReport.id}
                    onClick={() => handleResolve(firstReport.id, "DISMISSED")}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
