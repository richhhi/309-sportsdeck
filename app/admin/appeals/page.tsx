"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Pagination } from "../../../components/ui/Pagination";
import apiClient from "../../../lib/api-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Appeal {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export default function AppealsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") return;

    const fetchAppeals = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/appeals?page=${page}&limit=5`);
        setAppeals(res.data.data ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch appeals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppeals();
  }, [user, authLoading, page]);

  const handleResolve = async (appealId: string, status: "APPROVED" | "REJECTED") => {
    setProcessing(appealId);
    try {
      await apiClient.patch(`/appeals/${appealId}`, { status });
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
      toast.success(status === "APPROVED" ? "Appeal approved — user unbanned" : "Appeal rejected");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to process appeal");
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
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)] tracking-tight">Ban Appeals</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--sd-text-secondary)]">Loading appeals...</div>
      ) : appeals.length === 0 ? (
        <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-8 text-center">
          <p className="text-[var(--sd-text-secondary)]">No pending appeals 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl p-5 space-y-3">
              {/* User info */}
              <div className="flex items-center gap-3">
                <Avatar src={appeal.user.avatarUrl} name={appeal.user.username} size="sm" />
                <div>
                  <span
                    className="text-sm font-medium text-[var(--sd-accent)] hover:underline"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/profile/${appeal.user.id}`)}
                  >
                    {appeal.user.username}
                  </span>
                  <div className="text-xs text-[var(--sd-text-tertiary)]">
                    {new Date(appeal.createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className="ml-auto text-xs font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                  Banned
                </span>
              </div>

              {/* Appeal message */}
              <div className="bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-lg p-3">
                <p className="text-sm text-[var(--sd-text-primary)] italic">&quot;{appeal.message}&quot;</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={processing === appeal.id}
                  onClick={() => handleResolve(appeal.id, "APPROVED")}
                >
                  Approve & Unban
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={processing === appeal.id}
                  onClick={() => handleResolve(appeal.id, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}

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
