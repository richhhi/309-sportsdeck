"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "../../../lib/api-client";
import { MatchCard } from "../../../components/app/MatchCard";
import { ThreadCard } from "../../../components/app/ThreadCard";
import { Button } from "../../../components/ui/Button";

export default function MatchDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const res = await apiClient.get(`/matches/${id}`);
        setMatch(res.data);
        setThread(res.data.thread);
      } catch (err) {
        console.error("Failed to fetch match details", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMatchDetails();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-[var(--sd-text-secondary)]">Loading match details...</div>;
  if (!match) return <div className="p-12 text-center text-red-500">Match not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="cursor-pointer flex items-center gap-2 text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)] transition-colors text-sm font-semibold w-fit mb-2 relative z-20 mb-4"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Matches
      </button>

      {/* ---------------------------------------------------- */}
      {/* PREMIUM MATCH HERO HEADER */}
      {/* ---------------------------------------------------- */}
      <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--sd-bg-secondary)] to-[var(--sd-bg-tertiary)] border border-[var(--sd-border)] shadow-xl flex flex-col items-center">
        {/* Abstract Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--sd-text-primary) 2px, transparent 2px)', backgroundSize: '32px 32px' }}>
        </div>

        {/* Content */}
        <div className="relative w-full px-4 py-10 md:px-12 md:py-16 flex flex-col items-center z-10 transition-all duration-300">

          {/* Status Badge */}
          <div className="mb-8">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm ${match.status === 'LIVE' ? 'bg-[var(--sd-danger)] text-white animate-pulse' :
              match.status === 'FINISHED' ? 'bg-[var(--sd-success)] text-white opacity-90' :
                'bg-[var(--sd-bg-primary)] text-[var(--sd-text-secondary)] border border-[var(--sd-border)]'
              }`}>
              {match.status === 'LIVE' ? '🔴 Live Now' : match.status === 'FINISHED' ? 'Full Time' : 'Scheduled'}
            </span>
          </div>

          {/* Score & Teams Row */}
          <div className="w-full flex flex-row items-center justify-between md:justify-center gap-4 md:gap-16">

            {/* Home Team */}
            <div className="flex flex-col items-center flex-1 max-w-[140px] md:max-w-[220px]">
              {match.homeTeam?.crest ? (
                <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-20 h-20 md:w-36 md:h-36 object-contain filter drop-shadow-xl mb-3 md:mb-5 transition-transform hover:scale-105" />
              ) : (
                <div className="w-20 h-20 md:w-36 md:h-36 bg-[var(--sd-bg-primary)] rounded-full flex items-center justify-center mb-3 md:mb-5 border border-[var(--sd-border)] shadow-inner">
                  <span className="text-2xl md:text-4xl text-[var(--sd-text-tertiary)] font-bold">{match.homeTeam?.tla || "HM"}</span>
                </div>
              )}
              <h2 className="text-lg md:text-3xl font-bold font-[var(--sd-font)] text-center text-[var(--sd-text-primary)] leading-tight tracking-tight">
                {match.homeTeam?.name || "Home Team"}
              </h2>
            </div>

            {/* Score Container */}
            <div className="flex flex-col items-center justify-center shrink-0 min-w-[100px] md:min-w-[160px]">
              <div className="text-4xl md:text-[5.5rem] leading-none font-black tracking-tighter text-[var(--sd-text-primary)] font-[var(--sd-font)] flex items-center justify-center">
                <span>{match.homeScore ?? "-"}</span>
                <span className="text-2xl md:text-5xl text-[var(--sd-text-tertiary)] mx-2 md:mx-4 font-normal">:</span>
                <span>{match.awayScore ?? "-"}</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1 max-w-[140px] md:max-w-[220px]">
              {match.awayTeam?.crest ? (
                <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-20 h-20 md:w-36 md:h-36 object-contain filter drop-shadow-xl mb-3 md:mb-5 transition-transform hover:scale-105" />
              ) : (
                <div className="w-20 h-20 md:w-36 md:h-36 bg-[var(--sd-bg-primary)] rounded-full flex items-center justify-center mb-3 md:mb-5 border border-[var(--sd-border)] shadow-inner">
                  <span className="text-2xl md:text-4xl text-[var(--sd-text-tertiary)] font-bold">{match.awayTeam?.tla || "AW"}</span>
                </div>
              )}
              <h2 className="text-lg md:text-3xl font-bold font-[var(--sd-font)] text-center text-[var(--sd-text-primary)] leading-tight tracking-tight">
                {match.awayTeam?.name || "Away Team"}
              </h2>
            </div>

          </div>
        </div>

        {/* Match Metadata Footer */}
        <div className="w-full bg-[var(--sd-bg-primary)]/40 border-t border-[var(--sd-border)] backdrop-blur-md px-4 py-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs md:text-sm text-[var(--sd-text-secondary)] font-medium">
          {match.matchday?.name && (
            <div className="flex items-center gap-1.5 bg-[var(--sd-bg-primary)]/50 px-3 py-1 rounded-full border border-[var(--sd-border)] text-[var(--sd-text-primary)] shadow-sm">
              <svg className="w-4 h-4 opacity-70 text-[var(--sd-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{match.matchday.name}</span>
            </div>
          )}
          {match.utcDate && (
            <div className="flex items-center gap-1.5 bg-[var(--sd-bg-primary)]/50 px-3 py-1 rounded-full border border-[var(--sd-border)]">
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>
                {new Date(match.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1.5 bg-[var(--sd-bg-primary)]/50 px-3 py-1 rounded-full border border-[var(--sd-border)]">
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="truncate max-w-[200px]">{match.venue}</span>
            </div>
          )}
          {match.stage && match.stage !== "REGULAR_SEASON" && (
            <div className="flex items-center gap-1.5 bg-[var(--sd-primary)]/10 text-[var(--sd-primary)] px-3 py-1 rounded-full border border-[var(--sd-primary)]/20 font-semibold tracking-wide uppercase text-[10px] md:text-xs">
              <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              <span>{match.stage.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DISCUSSION THREAD SECTION */}
      {/* ---------------------------------------------------- */}
      <div className="w-full bg-[var(--sd-bg-primary)] border border-[var(--sd-border)] rounded-xl md:rounded-2xl p-6 md:p-10 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-[var(--sd-border)] pb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)] mb-2 flex items-center gap-3">
              <svg className="w-8 h-8 text-[var(--sd-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              Match Discussion
            </h2>
            <p className="text-sm md:text-base text-[var(--sd-text-tertiary)]">
              Join thousands of fans in the official thread for this match
            </p>
          </div>
          {thread?.sentimentTotal && (
            <div className="relative z-10 flex gap-2.5 items-center text-sm font-semibold bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] px-4 py-2 rounded-xl shadow-inner">
              <span className="text-[var(--sd-text-secondary)] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--sd-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Mood:
              </span>
              <span className={`px-2 py-0.5 rounded-md ${thread.sentimentTotal === "POSITIVE" ? "bg-[var(--sd-success)]/10 text-[var(--sd-success)]" :
                thread.sentimentTotal === "NEGATIVE" ? "bg-[var(--sd-danger)]/10 text-[var(--sd-danger)]" : "bg-[var(--sd-warning)]/10 text-[var(--sd-warning)]"
                }`}>
                {thread.sentimentTotal}
              </span>
            </div>
          )}
        </div>

        {thread ? (
          <div className="transform transition-transform duration-200 hover:-translate-y-1" onClick={() => router.push(`/threads/${thread.id}`)}>
            <div className="cursor-pointer">
              <ThreadCard
                title={thread.title}
                author={thread.author?.username || "System"}
                authorAvatar={thread.author?.avatarUrl}
                replyCount={thread.posts?.length || 0}
                tags={thread.tags?.map((t: any) => t.name) || ["Match Thread"]}
                timeAgo={new Date(thread.createdAt).toLocaleDateString()}
                sentiment={thread.sentimentTotal}
                isAiFlagged={thread.isAiFlagged}
                preview={thread.content.substring(0, 150) + "..."}
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-[var(--sd-bg-secondary)] border-2 border-dashed border-[var(--sd-border)] rounded-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[var(--sd-bg-primary)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--sd-border)]">
              <svg className="w-8 h-8 text-[var(--sd-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-lg font-medium text-[var(--sd-text-primary)] mb-2">No thread has been created yet</p>
            <p className="text-sm text-[var(--sd-text-secondary)] mb-8 max-w-sm">Be the first to start the discussion for this match and share your thoughts with the community.</p>
            <Button className="px-8 py-3 rounded-full text-base shadow-md hover:shadow-lg transition-all" onClick={() => router.push(`/threads/create?matchId=${match.id}`)}>
              Start Discussion
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
