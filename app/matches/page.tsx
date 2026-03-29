"use client";

import React, { useEffect, useState } from "react";
import { MatchCard } from "../../components/app/MatchCard";
import { Pagination } from "../../components/ui/Pagination";
import apiClient from "../../lib/api-client";
import Link from "next/link";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "LIVE" | "TIMED" | "FINISHED">("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "PAST">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12"
        });

        if (filter !== "ALL") params.append("status", filter);
        if (dateFilter !== "ALL") params.append("timeframe", dateFilter);

        const res = await apiClient.get(`/matches?${params.toString()}`);
        if (res.data?.data) {
          setMatches(res.data.data);
          setTotalPages(res.data.totalPages || 1);
        } else {
          setMatches(Array.isArray(res.data) ? res.data : []);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Failed to fetch matches", err);
      } finally {
        setLoading(false);
      }
    };

    // Slight debounce effect can be added here if needed, but direct call is fine for dropdowns
    fetchMatches();
  }, [page, filter, dateFilter]);

  const handleFilterChange = (status: any) => {
    if (filter !== status) {
      setFilter(status);
      setPage(1);
    }
  };

  const handleDateFilterChange = (dt: any) => {
    if (dateFilter !== dt) {
      setDateFilter(dt);
      setPage(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-[var(--sd-font)] tracking-tight">Match Hub</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-lg w-fit">
            {["ALL", "TODAY", "UPCOMING", "PAST"].map((dt) => (
              <button
                key={dt}
                onClick={() => handleDateFilterChange(dt as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${dateFilter === dt
                  ? "bg-[var(--sd-bg-elevated)] text-[var(--sd-accent)] shadow-sm"
                  : "text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)] cursor-pointer"
                  }`}
              >
                {dt === "ALL" ? "Any Date" : dt === "UPCOMING" ? "LATER" : dt}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 p-1 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-lg w-fit">
            {["ALL", "LIVE", "TIMED", "FINISHED"].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === status
                  ? "bg-[var(--sd-bg-elevated)] text-[var(--sd-text-primary)] shadow-sm"
                  : "text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)] cursor-pointer"
                  }`}
              >
                {status === "ALL" ? "All Status" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[var(--sd-text-secondary)]">Loading matches...</div>
      ) : matches.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link href={`/matches/${match.id}`} key={match.id} className="block hover:scale-[1.02] transition-transform">
                <MatchCard
                  homeTeam={match.homeTeam?.name || "TBD"}
                  awayTeam={match.awayTeam?.name || "TBD"}
                  homeCrest={match.homeTeam?.crest}
                  awayCrest={match.awayTeam?.crest}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  status={match.status as any || "TIMED"}
                  venue={match.venue}
                  date={match.utcDate ? new Date(match.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
                  time={match.utcDate ? new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
                />
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl">
          <p className="text-[var(--sd-text-tertiary)]">No matches found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
