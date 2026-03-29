"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { Button } from "../../components/ui/Button";
import apiClient from "../../lib/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Admin stats
  const [adminStats, setAdminStats] = useState<{
    pendingReports: number;
    pendingAppeals: number;
    flaggedContent: number;
  } | null>(null);

  // Fetch admin stats
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const fetchAdminStats = async () => {
      try {
        const [reportsRes, appealsRes, flaggedRes] = await Promise.all([
          apiClient.get("/reports?limit=1"),
          apiClient.get("/appeals?limit=1"),
          apiClient.get("/moderation/flagged?limit=1"),
        ]);
        setAdminStats({
          pendingReports: reportsRes.data.pagination?.totalItems ?? 0,
          pendingAppeals: appealsRes.data.pagination?.totalItems ?? 0,
          flaggedContent:
            (flaggedRes.data.threads?.pagination?.totalItems ?? 0) +
            (flaggedRes.data.posts?.pagination?.totalItems ?? 0),
        });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };

    fetchAdminStats();
  }, [user]);

  if (authLoading) return <div className="p-8 text-center text-[var(--sd-text-secondary)]">Loading...</div>;
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4 mt-12">
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)]">Restricted Access</h1>
        <p className="text-[var(--sd-text-secondary)]">The dashboard is restricted to administrator personnel only. Please return to the homepage to view your feed.</p>
        <Button variant="primary" onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)] tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-[var(--sd-text-secondary)] mt-1">
          Review pending reports, ban appeals, and AI flagged content.
        </p>
      </div>

      {/* Admin Panel */}
      {adminStats && (
        <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[var(--sd-text-secondary)] uppercase tracking-wider">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/admin/reports" className="block" style={{ textDecoration: "none" }}>
              <div className="bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-xl p-4 text-center hover:border-[var(--sd-accent)] transition-colors" style={{ cursor: "pointer" }}>
                <div className={`text-2xl font-bold tabular-nums ${adminStats.pendingReports > 0 ? "text-red-400" : "text-[var(--sd-text-primary)]"}`}>
                  {adminStats.pendingReports}
                </div>
                <div className="text-xs text-[var(--sd-text-secondary)] mt-1">Pending Reports</div>
              </div>
            </Link>
            <Link href="/admin/appeals" className="block" style={{ textDecoration: "none" }}>
              <div className="bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-xl p-4 text-center hover:border-[var(--sd-accent)] transition-colors" style={{ cursor: "pointer" }}>
                <div className={`text-2xl font-bold tabular-nums ${adminStats.pendingAppeals > 0 ? "text-yellow-400" : "text-[var(--sd-text-primary)]"}`}>
                  {adminStats.pendingAppeals}
                </div>
                <div className="text-xs text-[var(--sd-text-secondary)] mt-1">Ban Appeals</div>
              </div>
            </Link>
            <Link href="/admin/flagged" className="block" style={{ textDecoration: "none" }}>
              <div className="bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-xl p-4 text-center hover:border-[var(--sd-accent)] transition-colors" style={{ cursor: "pointer" }}>
                <div className={`text-2xl font-bold tabular-nums ${adminStats.flaggedContent > 0 ? "text-orange-400" : "text-[var(--sd-text-primary)]"}`}>
                  {adminStats.flaggedContent}
                </div>
                <div className="text-xs text-[var(--sd-text-secondary)] mt-1">AI Flagged</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
