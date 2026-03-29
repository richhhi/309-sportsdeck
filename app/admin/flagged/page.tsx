"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/ui/Avatar";
import { Pagination } from "../../../components/ui/Pagination";
import apiClient from "../../../lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FlaggedThread {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string };
}

interface FlaggedPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string };
  thread: { id: string; title: string };
}

export default function FlaggedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<FlaggedThread[]>([]);
  const [threadsPage, setThreadsPage] = useState(1);
  const [threadsTotalPages, setThreadsTotalPages] = useState(1);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const [posts, setPosts] = useState<FlaggedPost[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || user.role !== "ADMIN") return;
    const fetchThreads = async () => {
      setThreadsLoading(true);
      try {
        const res = await apiClient.get(`/moderation/flagged?type=threads&page=${threadsPage}&limit=5`);
        setThreads(res.data.threads?.data ?? []);
        setThreadsTotalPages(res.data.threads?.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch flagged threads", err);
      } finally {
        setThreadsLoading(false);
      }
    };
    fetchThreads();
  }, [user, authLoading, threadsPage]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "ADMIN") return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await apiClient.get(`/moderation/flagged?type=posts&page=${postsPage}&limit=5`);
        setPosts(res.data.posts?.data ?? []);
        setPostsTotalPages(res.data.posts?.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch flagged posts", err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [user, authLoading, postsPage]);

  if (authLoading) return <div className="p-8 text-center text-[var(--sd-text-secondary)]">Loading...</div>;
  if (!user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-red-500">Unauthorized. Admins only.</div>;
  }

  const isEmpty = threads.length === 0 && posts.length === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
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
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)] tracking-tight">AI Flagged Content</h1>
      </div>

      <p className="text-sm text-[var(--sd-text-secondary)]">
        Content automatically flagged by the AI moderation system for review.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Threads Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--sd-text-primary)] border-b border-[var(--sd-border)] pb-2">
            Flagged Threads
          </h2>
          {threadsLoading ? (
            <div className="text-center py-8 text-[var(--sd-text-secondary)]">Loading threads...</div>
          ) : threads.length === 0 ? (
            <p className="text-sm text-[var(--sd-text-tertiary)]">No flagged threads.</p>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="bg-[var(--sd-bg-secondary)] border border-orange-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/10 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--sd-text-primary)]">{thread.author.username}</span>
                    <span className="text-xs text-[var(--sd-text-tertiary)]">
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--sd-text-primary)] mb-1">{thread.title}</h3>
                  <p className="text-sm text-[var(--sd-text-secondary)] line-clamp-3">{thread.content}</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link href={`/threads/${thread.id}`} className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors">
                    View Thread →
                  </Link>
                </div>
              </div>
            ))
          )}

          <Pagination
            currentPage={threadsPage}
            totalPages={threadsTotalPages}
            onPageChange={setThreadsPage}
            disabled={threadsLoading}
          />
        </div>

        {/* Posts Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--sd-text-primary)] border-b border-[var(--sd-border)] pb-2">
            Flagged Posts
          </h2>
          {postsLoading ? (
            <div className="text-center py-8 text-[var(--sd-text-secondary)]">Loading posts...</div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-[var(--sd-text-tertiary)]">No flagged posts.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-[var(--sd-bg-secondary)] border border-orange-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/10 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--sd-text-primary)]">{post.author.username}</span>
                    <span className="text-xs text-[var(--sd-text-tertiary)]">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[var(--sd-text-tertiary)] bg-[var(--sd-bg-primary)] px-2 py-1 rounded truncate">
                  In: {post.thread.title}
                </div>

                <p className="text-sm text-[var(--sd-text-secondary)] line-clamp-4">{post.content}</p>

                <div className="pt-2 flex justify-end">
                  <Link href={`/threads/${post.thread.id}`} className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors">
                    View Post →
                  </Link>
                </div>
              </div>
            ))
          )}

          <Pagination
            currentPage={postsPage}
            totalPages={postsTotalPages}
            onPageChange={setPostsPage}
            disabled={postsLoading}
          />
        </div>
      </div>
    </div>
  );
}
