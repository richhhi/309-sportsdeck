"use client";

import React, { Suspense, useEffect, useState } from "react";
import apiClient from "../../lib/api-client";
import { ThreadCard } from "../../components/app/ThreadCard";
import { SearchBar } from "../../components/app/SearchBar";
import { Button } from "../../components/ui/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ThreadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = {
    title: searchParams.get("title") || searchParams.get("q") || "",
    author: searchParams.get("author") || "",
    team: searchParams.get("team") || ""
  };

  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(searchParams.get("tags") || "All Topics");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, initialQuery.title, initialQuery.author, initialQuery.team]);

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const tagsToSearch = [];
        if (activeFilter !== "All Topics") tagsToSearch.push(activeFilter);

        // Always pass them appropriately
        const filterParam = tagsToSearch.length > 0 ? `tags=${encodeURIComponent(tagsToSearch.join(','))}` : "";

        const params = new URLSearchParams();
        if (initialQuery.title) params.append("title", initialQuery.title);
        if (initialQuery.author) params.append("author", initialQuery.author);
        if (initialQuery.team) params.append("team", initialQuery.team);

        const searchParamStr = params.toString();

        const queryStr = [filterParam, searchParamStr].filter(Boolean).join('&');
        const res = await apiClient.get(`/threads?page=${page}&limit=10${queryStr ? '&' + queryStr : ''}`);
        const data = res.data?.data || res.data;
        setThreads(Array.isArray(data) ? data : []);
        setTotalPages(res.data?.meta?.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch threads", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, [activeFilter, initialQuery.title, initialQuery.author, initialQuery.team, page]);

  const handleSearch = (q: any) => {
    const params = new URLSearchParams();
    if (q.title) params.append("title", q.title);
    if (q.author) params.append("author", q.author);
    if (q.team) params.append("team", q.team);
    if (activeFilter !== "All Topics") params.append("tags", activeFilter);

    if (params.toString()) {
      router.push(`/threads?${params.toString()}`);
    } else {
      router.push(`/threads`);
    }
  };

  const displayedThreads = threads;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-[var(--sd-font)] tracking-tight text-[var(--sd-text-primary)]">
            Forums
          </h1>
          <p className="text-[var(--sd-text-secondary)] mt-1">Join the community discussion</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/threads/create")}>
          + New Thread
        </Button>
      </div>

      <div className="flex items-center">
        <SearchBar
          placeholder="Search by title..."
          onSearch={handleSearch}
          filters={["All Topics", "Match Thread", "General"]}
          activeFilter={activeFilter}
          onFilterChange={(tag) => {
            setActiveFilter(tag);
            const params = new URLSearchParams(searchParams.toString());
            if (tag === "All Topics") params.delete("tags");
            else params.set("tags", tag);
            router.push(`/threads?${params.toString()}`);
          }}
          allowCustomFilter={true}
          initialQuery={initialQuery}
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-[var(--sd-text-secondary)]">Loading threads...</div>
      ) : displayedThreads.length > 0 ? (
        <div className="flex flex-col gap-4">
          {displayedThreads.map((thread) => (
            <Link href={`/threads/${thread.id}`} key={thread.id} className="block hover:no-underline">
              <ThreadCard
                title={thread.title}
                author={thread.author?.username || "System"}
                authorAvatar={thread.author?.avatarUrl}
                onAuthorClick={(thread.author?.id || thread.authorId) ? () => router.push(`/profile/${thread.author?.id || thread.authorId}`) : undefined}
                replyCount={thread._count?.posts || 0}
                tags={thread.tags?.map((t: any) => t.name) || []}
                timeAgo={new Date(thread.createdAt).toLocaleDateString()}
                closesAt={thread.match?.utcDate ? new Date(new Date(thread.match.utcDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined}
                teamName={thread.team?.name || thread.team?.shortName}
                teamCrest={thread.team?.crest}
                sentiment={thread.sentimentTotal}
                isAiFlagged={thread.isAiFlagged}
                preview={thread.content?.substring(0, 120) + "..."}
              />
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="secondary"
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-[var(--sd-text-secondary)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  setPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl">
          <p className="text-[var(--sd-text-secondary)] mb-4">No discussions found.</p>
          <Button variant="secondary" onClick={() => router.push("/threads/create")}>
            Be the first to post
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ThreadsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[var(--sd-text-secondary)]">Loading...</div>}>
      <ThreadsContent />
    </Suspense>
  );
}
