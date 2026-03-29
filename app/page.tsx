"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import apiClient from "../lib/api-client";
import { ThreadCard } from "../components/app/ThreadCard";
import { Button } from "../components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function HomeFeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  const [digest, setDigest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch AI Daily Digest
        const digestRes = await apiClient.get("/digest").catch(() => null);
        if (digestRes?.data) setDigest(digestRes.data);

        // Fetch user feed or public feed if logged out
        const feedRes = await apiClient.get(user ? "/users/me/feed" : "/threads?limit=5").catch(() => null);
        if (feedRes?.data) {
          // Normalize to common feed structure
          let items: any[] = [];
          if (user) {
            items = feedRes.data.data || [];
          } else {
            const data = feedRes.data.data || feedRes.data;
            items = (Array.isArray(data) ? data : []).map((t: any) => ({ type: 'NEW_THREAD', data: t }));
          }
          setFeedEvents(items);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, authLoading]);

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[var(--sd-font)] tracking-tight text-[var(--sd-text-primary)]">
            {user ? `Welcome back, ${user.username}` : "SportsDeck Top Stories"}
          </h1>
          <p className="text-[var(--sd-text-secondary)] mt-1">Your personalized sports hub.</p>
        </div>
        {!user && (
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => router.push("/login")}>Login</Button>
            <Button variant="primary" onClick={() => router.push("/signup")}>Sign Up</Button>
          </div>
        )}
      </div>

      {/* Daily Digest */}
      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-3xl p-6 md:p-8 relative">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)]">
            Daily Digest
          </h2>
        </div>

        {digest ? (
          <div className="text-[var(--sd-text-secondary)] leading-relaxed space-y-4 
            [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:text-[var(--sd-text-primary)] 
            [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:text-[var(--sd-text-primary)] 
            [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-1 [&>h3]:text-[var(--sd-text-primary)] 
            [&>ul]:list-disc [&>ul]:pl-6 
            [&>ol]:list-decimal [&>ol]:pl-6 
            [&>p]:mb-2 
            [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--sd-border)] [&>blockquote]:pl-4 [&>blockquote]:italic 
            [&>strong]:text-[var(--sd-text-primary)]"
          >
            <ReactMarkdown>{digest.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[var(--sd-text-secondary)] leading-relaxed italic">
            We are currently analyzing today's biggest sports news and forum trends. Check back shortly for your personalized summary!
          </p>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)]">
          {user ? "Your Feed" : "Trending Discussions"}
        </h3>

        {loading ? (
          <div className="text-center py-12 text-[var(--sd-text-tertiary)]">Loading timeline...</div>
        ) : feedEvents.length > 0 ? (
          <div className="flex flex-col gap-4">
            {feedEvents.map((event, idx) => {
              if (event.type === 'NEW_THREAD') {
                const t = event.data;
                return (
                  <Link href={`/threads/${t.id}`} key={`thread-${t.id || idx}`} className="block hover:no-underline">
                    <ThreadCard
                      title={t.title}
                      author={t.author?.username || "Unknown"}
                      authorAvatar={t.author?.avatarUrl}
                      replyCount={t.posts?.length || 0}
                      tags={t.tags?.map((tag: any) => tag.name) || []}
                      timeAgo={t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                      sentiment={t.sentimentTotal}
                      isAiFlagged={t.isAiFlagged}
                      preview={t.content?.substring(0, 100) + "..."}
                    />
                  </Link>
                );
              }
              if (event.type === 'THREAD_REPLIES') {
                const actorsText = event.data.actors.slice(0, 3).map((a: any) => a.username).join(', ') + (event.data.actors.length > 3 ? ` and ${event.data.actors.length - 3} others` : '');
                const replyText = event.data.replyCount === 1 ? '1 new reply' : `${event.data.replyCount} new replies`;
                return (
                  <Link href={`/threads/${event.data.threadId}`} key={`replies-${event.data.threadId || idx}`} className="block hover:no-underline">
                    <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-colors hover:bg-[var(--sd-bg-tertiary)]">
                      <div className="bg-[var(--sd-bg-tertiary)] p-3 rounded-full text-lg">💬</div>
                      <div>
                        <p className="text-[var(--sd-text-primary)] font-medium text-sm">
                          <strong className="text-[var(--sd-text-primary)]">{actorsText}</strong> left {replyText} in <em className="not-italic font-semibold text-[var(--sd-link)]">{event.data.threadTitle}</em>.
                        </p>
                        <span className="text-xs text-[var(--sd-text-tertiary)]">{new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              }
              if (event.type === 'MATCH_UPDATE') {
                const isFinished = event.data.status === 'FINISHED';
                const statusText = isFinished ? 'FULL TIME' : (event.data.status === 'IN_PLAY' || event.data.status === 'LIVE' ? 'LIVE' : event.data.status);
                const statusColor = isFinished ? 'var(--sd-text-tertiary)' : 'var(--sd-success)';
                return (
                  <Link href={`/matches/${event.data.id}`} key={`match-${event.data.id || idx}`} className="block hover:no-underline">
                    <div className="bg-[var(--sd-bg-secondary)] border border-l-4 border-[var(--sd-border)] rounded-2xl p-4 flex justify-between items-center shadow-sm transition-colors hover:bg-[var(--sd-bg-tertiary)]" style={{ borderLeftColor: statusColor }}>
                      <div>
                        <span className="text-xs font-bold mb-1 block uppercase tracking-wider" style={{ color: statusColor }}>{statusText}</span>
                        <p className="text-[var(--sd-text-primary)] font-medium font-[var(--sd-font)]">
                          {event.data.homeTeam?.name} {event.data.homeScore ?? '-'} - {event.data.awayScore ?? '-'} {event.data.awayTeam?.name}
                        </p>
                      </div>
                      <Button variant="primary" size="sm">View Thread</Button>
                    </div>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl">
            <p className="text-[var(--sd-text-tertiary)]">Your feed is currently empty.</p>
            {user && (
              <Button variant="primary" className="mt-4" onClick={() => router.push("/threads")}>
                Explore Forums
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
