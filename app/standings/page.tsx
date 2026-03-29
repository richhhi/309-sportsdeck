"use client";

import React, { useEffect, useState } from "react";
import { StandingsRow } from "../../components/app/StandingsRow";
import apiClient from "../../lib/api-client";

export default function StandingsPage() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await apiClient.get("/standings");
        const data = res.data;
        // The API returns an array of Standing objects, each with a teamStandings array.
        // We'll extract the teamStandings from the first one as a default.
        setStandings(data.length > 0 ? data[0].teamStandings : []);
      } catch (err) {
        console.error("Failed to fetch standings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-[var(--sd-font)] tracking-tight">League Standings</h1>
      </div>

      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="grid grid-cols-[36px_1fr_repeat(5,36px)_48px_80px] gap-1 items-center px-[14px] py-[10px] border-b border-[var(--sd-border)] text-[11px] font-bold text-[var(--sd-text-tertiary)] uppercase tracking-wider bg-[var(--sd-bg-tertiary)]">
          <span className="text-center">#</span>
          <span>Club</span>
          <span className="text-center" title="Played">MP</span>
          <span className="text-center" title="Won">W</span>
          <span className="text-center" title="Drawn">D</span>
          <span className="text-center" title="Lost">L</span>
          <span className="text-center" title="Goal Difference">GD</span>
          <span className="text-center" title="Points">Pts</span>
          <span className="text-right">Form</span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center text-[var(--sd-text-secondary)]">
            Loading standings...
          </div>
        )}

        {/* Empty State */}
        {!loading && standings.length === 0 && (
          <div className="p-8 text-center text-[var(--sd-text-secondary)]">
            No standings data available at the moment.
          </div>
        )}

        {/* Data Rows */}
        {!loading && standings.map((item, index) => (
          <StandingsRow
            key={item.teamId || index}
            position={item.position || index + 1}
            teamName={item.team?.name || "Unknown"}
            teamCrest={item.team?.crest}
            matchesPlayed={item.matchesPlayed || 0}
            won={item.won || 0}
            drawn={item.drawn || 0}
            lost={item.lost || 0}
            goalDifference={item.goalDifference || 0}
            points={item.points || 0}
            form={item.form}
          />
        ))}
      </div>
    </div>
  );
}
