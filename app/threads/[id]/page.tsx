"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "../../../lib/api-client";
import { useAuth } from "../../../components/AuthProvider";
import { ThreadCard } from "../../../components/app/ThreadCard";
import { PostCard } from "../../../components/app/PostCard";
import { PollCard } from "../../../components/app/PollCard";
import { MatchCard } from "../../../components/app/MatchCard";
import { TextArea } from "../../../components/ui/TextArea";
import { Button } from "../../../components/ui/Button";
import toast from "react-hot-toast";

export default function ThreadViewPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadVal, setEditThreadVal] = useState("");
  const [isViewingThreadHistory, setIsViewingThreadHistory] = useState(false);

  // Polls State
  const [isAddingPoll, setIsAddingPoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState("");

  const [editPollId, setEditPollId] = useState<string | null>(null);
  const [editPollQuestion, setEditPollQuestion] = useState("");
  const [editPollOptions, setEditPollOptions] = useState("");

  const [deletePollId, setDeletePollId] = useState<string | null>(null);

  // Translation State mapping post IDs to their translated content and toggle state
  const [translations, setTranslations] = useState<Record<string, { content: string; active: boolean }>>({});
  const [threadTranslation, setThreadTranslation] = useState<{ content: string; active: boolean } | null>(null);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportItemId, setReportItemId] = useState<{ type: 'THREAD' | 'POST', id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchThread = async (currentPage = page) => {
    try {
      const res = await apiClient.get(`/threads/${id}?page=${currentPage}&limit=10`);
      setThread(res.data);
      const totalPosts = res.data._count?.posts || 0;
      setTotalPages(Math.ceil(totalPosts / 10) || 1);
    } catch (err) {
      console.error("Failed to fetch thread", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchThread(page);
  }, [id, page]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/threads/${id}/replies`, { content: replyContent });
      setReplyContent("");
      toast.success("Reply posted!");
      fetchThread(); // refresh
    } catch (err) {
      toast.error("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, pollOptionId: string) => {
    try {
      await apiClient.post(`/polls/${pollId}/votes`, { pollOptionId });
      toast.success("Vote recorded!");
      fetchThread(); // Background refresh
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to vote.");
    }
  };

  const handleAddPoll = async () => {
    if (!newPollQuestion || !newPollOptions) return;
    const options = newPollOptions.split(",").map(o => o.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error("Need at least 2 options");
      return;
    }
    try {
      await apiClient.post(`/threads/${id}/polls`, {
        question: newPollQuestion,
        options,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast.success("Poll added!");
      setIsAddingPoll(false);
      setNewPollQuestion("");
      setNewPollOptions("");
      fetchThread();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add poll");
    }
  };

  const handleEditPollInit = (poll: any) => {
    setEditPollId(poll.id);
    setEditPollQuestion(poll.question);
    setEditPollOptions(poll.options.map((o: any) => o.text).join(", "));
  };

  const handleSaveEditPoll = async () => {
    if (!editPollId || !editPollQuestion || !editPollOptions) return;
    const options = editPollOptions.split(",").map(o => o.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error("Need at least 2 options");
      return;
    }

    try {
      await apiClient.put(`/polls/${editPollId}`, {
        question: editPollQuestion,
        options
      });
      toast.success("Poll updated!");
      setEditPollId(null);
      fetchThread();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update poll");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      await apiClient.delete(`/polls/${pollId}`);
      toast.success("Poll deleted!");
      setDeletePollId(null);
      fetchThread();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete poll");
    }
  };

  const toggleThreadTranslation = async () => {
    if (threadTranslation && threadTranslation.content) {
      setThreadTranslation({
        ...threadTranslation,
        active: !threadTranslation.active
      });
      return;
    }

    const loadingToast = toast.loading("Translating to English...");
    try {
      const res = await apiClient.get(`/threads/${id}/translation?lang=en`);
      setThreadTranslation({
        content: res.data.translation || "AI Translation failed.",
        active: true
      });
      toast.dismiss(loadingToast);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Translation service unavailable.");
    }
  };

  const toggleTranslation = async (postId: string, originalContent: string) => {
    const currentState = translations[postId];

    // If we already have the translation, just toggle
    if (currentState && currentState.content) {
      setTranslations({
        ...translations,
        [postId]: { ...currentState, active: !currentState.active }
      });
      return;
    }

    const loadingToast = toast.loading("Translating to English...");
    try {
      const res = await apiClient.get(`/replies/${postId}/translation?lang=en`);
      setTranslations({
        ...translations,
        [postId]: { content: res.data.translation || "AI Translation failed.", active: true }
      });
      toast.dismiss(loadingToast);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Translation service unavailable.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;
    try {
      await apiClient.delete(`/replies/${postId}`);
      toast.success("Post deleted");
      fetchThread();
    } catch (err) {
      toast.error("Failed to delete post.");
    }
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    if (!newContent) return;

    try {
      await apiClient.put(`/replies/${postId}`, { content: newContent });
      toast.success("Post updated");
      fetchThread();
    } catch (err) {
      toast.error("Failed to update post.");
    }
  };

  const handleEditThread = async () => {
    if (!editThreadVal || editThreadVal === thread.content) {
      setIsEditingThread(false);
      return;
    }

    try {
      await apiClient.put(`/threads/${id}`, { content: editThreadVal });
      toast.success("Thread updated");
      setIsEditingThread(false);
      fetchThread();
    } catch (err) {
      toast.error("Failed to update thread.");
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm("Are you sure you want to delete this thread?")) return;
    try {
      await apiClient.delete(`/threads/${id}`);
      toast.success("Thread deleted");
      router.push("/threads");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete thread.");
    }
  };

  const openReportModal = (type: 'THREAD' | 'POST', itemId: string) => {
    setReportItemId({ type, id: itemId });
    setReportReason("");
    setReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportItemId || !reportReason.trim()) return;
    try {
      await apiClient.post(`/reports`, {
        resourceId: reportItemId.id,
        resourceType: reportItemId.type,
        reason: reportReason,
      });
      toast.success("Report submitted to moderators.");
      setReportModalOpen(false);
    } catch (err: any) {
      if (err.response?.data?.error === "Report already exists") {
        toast.error("You have already reported this content.");
      } else {
        toast.error("Failed to submit report.");
      }
    }
  };

  if (loading) return <div className="p-12 text-center text-[var(--sd-text-secondary)]">Loading thread...</div>;
  if (!thread) return <div className="p-12 text-center text-red-500">Thread not found.</div>;

  const isThreadAuthor = user?.id === thread.authorId;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-8 relative">
      {/* Mobile-only Match Info Header */}
      {thread.match && (
        <div className="xl:hidden mb-6 flex justify-center">
          <MatchCard
            homeTeam={thread.match.homeTeam?.name || "TBD"}
            awayTeam={thread.match.awayTeam?.name || "TBD"}
            homeCrest={thread.match.homeTeam?.crest}
            awayCrest={thread.match.awayTeam?.crest}
            homeScore={thread.match.homeScore}
            awayScore={thread.match.awayScore}
            status={thread.match.status as any || "TIMED"}
            venue={thread.match.venue}
            date={thread.match.utcDate ? new Date(thread.match.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
            time={thread.match.utcDate ? new Date(thread.match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
          />
        </div>
      )}
      {/* Back Button */}
      <div className="xl:absolute xl:right-full xl:top-6 mb-2 xl:mb-0">
        <Button variant="secondary" onClick={() => router.push("/threads")}>
          ←
        </Button>
      </div>

      {/* Main Thread Post */}
      <div className="relative">
        <ThreadCard
          title={thread.title}
          author={thread.author?.username || "System"}
          authorAvatar={thread.author?.avatarUrl}
          onAuthorClick={thread.authorId ? () => router.push(`/profile/${thread.authorId}`) : undefined}
          replyCount={thread.posts?.length || 0}
          tags={thread.tags?.map((t: any) => t.name) || []}
          timeAgo={new Date(thread.createdAt).toLocaleDateString()}
          closesAt={thread.match?.utcDate ? new Date(new Date(thread.match.utcDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined}
          teamName={thread.team?.name || thread.team?.shortName}
          teamCrest={thread.team?.crest}
          sentiment={thread.sentimentTotal}
          isAiFlagged={thread.isAiFlagged}
        />

        {/* Main Content Body */}
        <div className="bg-[var(--sd-bg-primary)] border-x border-b border-[var(--sd-border)] -mt-2 pt-6 p-6 rounded-b-2xl shadow-sm">
          {thread.sentimentTotal && (
            <div className="flex gap-2 items-center text-sm font-medium bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] px-3 py-1.5 rounded-lg w-fit mb-4">
              <span className="text-[var(--sd-text-secondary)]">AI Mood:</span>
              <span className={
                thread.sentimentTotal === "POSITIVE" ? "text-[var(--sd-success)]" :
                  thread.sentimentTotal === "NEGATIVE" ? "text-[var(--sd-danger)]" : "text-[var(--sd-warning)]"
              }>
                {thread.sentimentTotal}
              </span>
            </div>
          )}
          {isEditingThread ? (
            <div className="flex flex-col gap-3">
              <TextArea
                value={editThreadVal}
                onChange={(e) => setEditThreadVal(e.target.value)}
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsEditingThread(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleEditThread}>Save</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[var(--sd-text-primary)] leading-relaxed whitespace-pre-wrap font-[var(--sd-font)]">
                {threadTranslation?.active && threadTranslation.content ? threadTranslation.content : thread.content}
                {thread.versions?.length > 0 && (
                  <span className="inline-flex items-center gap-2 ml-2">
                    <span
                      onClick={() => setIsViewingThreadHistory(!isViewingThreadHistory)}
                      className="text-xs text-[var(--sd-text-tertiary)] italic cursor-pointer hover:underline"
                      title="Click to view edit history"
                    >
                      (Edited)
                    </span>
                  </span>
                )}
              </div>

              {isViewingThreadHistory && thread.versions?.length > 0 && (
                <div className="mt-4 p-4 bg-[var(--sd-bg-elevated)] rounded-md border border-[var(--sd-border)]">
                  <h5 className="m-0 mb-3 text-xs text-[var(--sd-text-tertiary)] uppercase tracking-wider font-semibold">Edit History</h5>
                  <div className="flex flex-col gap-3">
                    <div className="opacity-80">
                      <div className="text-[11px] text-[var(--sd-text-tertiary)] mb-1">Current</div>
                      <div className="text-sm text-[var(--sd-text-secondary)]">{thread.content}</div>
                    </div>
                    {thread.versions.map((v: any, i: number) => (
                      <div key={i} className="opacity-60 pt-3 border-t border-[var(--sd-border)]">
                        <div className="text-[11px] text-[var(--sd-text-tertiary)] mb-1">
                          {new Date(v.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--sd-text-secondary)]">{v.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4 gap-4 border-t border-[var(--sd-border)] pt-4">
                <button
                  type="button"
                  onClick={toggleThreadTranslation}
                  className="text-sm text-[var(--sd-accent)] hover:opacity-80 transition-opacity cursor-pointer mr-auto"
                >
                  {threadTranslation?.active ? "Show Original" : "Translate to English"}
                </button>
                {!isThreadAuthor && user && (
                  <button
                    onClick={() => openReportModal('THREAD', thread.id)}
                    className="text-sm text-[var(--sd-text-tertiary)] hover:text-red-500 transition-colors cursor-pointer"
                    title="Report content"
                  >
                    Report
                  </button>
                )}
                {(isThreadAuthor || user?.role === 'ADMIN') && (
                  <>
                    <button
                      onClick={handleDeleteThread}
                      className="text-sm text-[var(--sd-text-tertiary)] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setEditThreadVal(thread.content);
                        setIsEditingThread(true);
                      }}
                      className="text-sm text-[var(--sd-text-tertiary)] hover:text-[var(--sd-text-primary)] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Polls Section */}
          {thread.polls && thread.polls.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--sd-border)] space-y-6">
              {thread.polls.map((poll: any) => {
                if (editPollId === poll.id) {
                  return (
                    <div key={poll.id} className="p-4 bg-[var(--sd-bg-elevated)] border border-[var(--sd-border)] rounded-xl space-y-3">
                      <h4 className="text-sm font-bold text-[var(--sd-text-primary)]">Edit Poll</h4>
                      <p className="text-xs text-[var(--sd-warning)] mb-2">⚠️ Editing options will reset all current votes and extend deadline by 7 days.</p>
                      <div className="space-y-4">
                        <input
                          className="w-full bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] p-2 rounded-md text-sm text-[var(--sd-text-primary)]"
                          placeholder="Question..."
                          value={editPollQuestion}
                          onChange={e => setEditPollQuestion(e.target.value)}
                        />
                        <input
                          className="w-full bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] p-2 rounded-md text-sm text-[var(--sd-text-primary)]"
                          placeholder="Options (comma separated)"
                          value={editPollOptions}
                          onChange={e => setEditPollOptions(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <Button variant="secondary" onClick={() => setEditPollId(null)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveEditPoll}>Save Changes</Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <PollCard
                    key={poll.id}
                    question={poll.question}
                    options={poll.options.map((o: any) => ({ id: o.id, text: o.text, votes: o.votes?.length || 0 }))}
                    totalVotes={poll.votes?.length || 0}
                    hasVoted={poll.votes?.some((v: any) => v.userId === user?.id)}
                    selectedOptionId={poll.votes?.find((v: any) => v.userId === user?.id)?.pollOptionId}
                    onVote={optionId => handleVote(poll.id, optionId)}
                    deadline={new Date(poll.deadline).toLocaleDateString()}
                    isAuthor={user?.id === poll.authorId || user?.role === "ADMIN"}
                    onEdit={() => handleEditPollInit(poll)}
                    onDelete={() => setDeletePollId(poll.id)}
                    versions={poll.versions}
                  />
                );
              })}
            </div>
          )}

          {/* Add Poll Inline UI */}
          {user && (
            <div className="mt-6 border-t border-[var(--sd-border)] pt-6">
              {!isAddingPoll ? (
                <Button variant="secondary" onClick={() => setIsAddingPoll(true)}>➕ Add a Poll</Button>
              ) : (
                <div className="p-4 bg-[var(--sd-bg-elevated)] border border-[var(--sd-border)] rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-[var(--sd-text-primary)]">New Poll</h4>
                  <div className="space-y-4">
                    <input
                      className="w-full bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] p-2 rounded-md text-sm text-[var(--sd-text-primary)]"
                      placeholder="Question..."
                      value={newPollQuestion}
                      onChange={e => setNewPollQuestion(e.target.value)}
                    />
                    <input
                      className="w-full bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] p-2 rounded-md text-sm text-[var(--sd-text-primary)]"
                      placeholder="Options (comma separated)"
                      value={newPollOptions}
                      onChange={e => setNewPollOptions(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" onClick={() => setIsAddingPoll(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddPoll}>Add Poll</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)] mb-6">
          Replies ({thread.posts?.length || 0})
        </h3>

        <div className="flex flex-col">
          {thread.posts?.length > 0 ? (
            thread.posts.map((post: any) => {
              const isPostAuthor = user?.id === post.authorId;
              const translationState = translations[post.id];

              return (
                <PostCard
                  key={post.id}
                  id={post.id}
                  author={post.author?.username || "Unknown"}
                  authorAvatar={post.author?.avatarUrl}
                  onAuthorClick={post.authorId ? () => router.push(`/profile/${post.authorId}`) : undefined}
                  content={post.content}
                  timeAgo={new Date(post.createdAt).toLocaleDateString()}
                  isHidden={post.isHidden}
                  isAiFlagged={post.isAiFlagged}
                  isEdited={post.versions?.length > 0}
                  isAuthor={isPostAuthor}
                  onDelete={(isPostAuthor || user?.role === 'ADMIN') ? () => handleDeletePost(post.id) : undefined}
                  onEdit={isPostAuthor ? (newContent) => handleEditPost(post.id, newContent) : undefined}
                  onReport={!isPostAuthor ? () => openReportModal('POST', post.id) : undefined}
                  onTranslateToggle={() => toggleTranslation(post.id, post.content)}
                  isTranslated={translationState?.active}
                  translatedContent={translationState?.content}
                  versions={post.versions}
                />
              );
            })
          ) : (
            <div className="text-center py-8 text-[var(--sd-text-tertiary)]">
              No replies yet. Be the first to join the conversation!
            </div>
          )}
        </div>

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

      {/* Reply Form */}
      {user ? (
        <form onSubmit={handleReply} className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 shadow-sm sticky bottom-4 z-10">
          <h4 className="text-sm font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)] mb-2">
            Leave a Reply
          </h4>
          <div className="flex flex-col gap-3">
            <TextArea
              placeholder="What are your thoughts?"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={submitting}>
                Reply
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl shadow-sm">
          <p className="text-[var(--sd-text-secondary)] mb-4">You must be logged in to reply.</p>
          <Button variant="secondary" onClick={() => router.push("/login")}>Login</Button>
        </div>
      )}

      {/* Desktop Sticky Sidebar (Right) */}
      {thread.match && (
        <div className="hidden xl:block absolute top-[24px]" style={{ left: 'calc(100% + 2rem)', width: '340px', height: '100%', pointerEvents: 'none' }}>
          <div className="sticky top-24 pointer-events-auto">
            <MatchCard
              homeTeam={thread.match.homeTeam?.name || "TBD"}
              awayTeam={thread.match.awayTeam?.name || "TBD"}
              homeCrest={thread.match.homeTeam?.crest}
              awayCrest={thread.match.awayTeam?.crest}
              homeScore={thread.match.homeScore}
              awayScore={thread.match.awayScore}
              status={thread.match.status as any || "TIMED"}
              venue={thread.match.venue}
              date={thread.match.utcDate ? new Date(thread.match.utcDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
              time={thread.match.utcDate ? new Date(thread.match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-[var(--sd-text-primary)] mb-4">Report Content</h3>
            <TextArea
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setReportModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submitReport} style={{ background: 'var(--sd-danger)', borderColor: 'var(--sd-danger)' }}>
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Poll Modal */}
      {deletePollId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-[var(--sd-text-primary)] mb-2">Delete Poll?</h3>
            <p className="text-sm text-[var(--sd-text-secondary)] mb-6">
              Are you sure you want to permanently delete this poll? All votes and options will be lost. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setDeletePollId(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => handleDeletePoll(deletePollId)} style={{ background: 'var(--sd-danger)', borderColor: 'var(--sd-danger)' }}>
                Delete Poll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
