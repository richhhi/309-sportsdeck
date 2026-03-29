"use client";

import React, { useState } from "react";
import apiClient from "../../../lib/api-client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { Input } from "../../../components/ui/Input";
import { TextArea } from "../../../components/ui/TextArea";
import { Button } from "../../../components/ui/Button";
import toast from "react-hot-toast";

export default function CreateThreadPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [teamId, setTeamId] = useState("");
  const [addPoll, setAddPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsInput, setPollOptionsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);

  React.useEffect(() => {
    // Fetch all teams to populate the dropdown
    apiClient.get("/teams")
      .then(res => setTeams(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to fetch teams", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const pollOptions = pollOptionsInput.split(",").map(o => o.trim()).filter(Boolean);

    try {
      const payload: any = {
        title,
        content,
        tags,
        teamId: teamId || null,
      };

      if (addPoll && pollQuestion && pollOptions.length >= 2) {
        payload.poll = {
          question: pollQuestion,
          options: pollOptions,
          // Set deadline 7 days from now
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

      const res = await apiClient.post("/threads", payload);
      toast.success("Thread created!");
      router.push(`/threads/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create thread");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)] mb-6">
          Create New Thread
        </h1>

        {!user && (
          <div className="bg-orange-500/10 border border-orange-500/50 text-orange-600 dark:text-orange-400 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
            <span>⚠️</span>
            <span>You are currently viewing as a guest. Please log in or sign up to publish a thread.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Title" 
            placeholder="What's on your mind?" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextArea 
            label="Content (Markdown supported)"
            placeholder="Write your main post here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full"
          />

          <Input 
            label="Tags (Comma separated)" 
            placeholder="e.g. Transfers, Tactics, Premier League" 
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold font-[var(--sd-font)] text-[var(--sd-text-primary)]">
              Associated Team <span className="text-[var(--sd-text-tertiary)] font-normal">(Optional)</span>
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="px-4 py-2.5 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl text-[var(--sd-text-primary)] text-sm font-[var(--sd-font)] outline-none transition-all placeholder:text-[var(--sd-text-tertiary)]"
            >
              <option value="">No Team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--sd-text-tertiary)]">Linking a team helps other fans find your thread when searching for the team.</p>
          </div>

          <div className="pt-4 border-t border-[var(--sd-border)]">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--sd-text-primary)] font-medium text-sm">
              <input 
                type="checkbox" 
                checked={addPoll}
                onChange={(e) => setAddPoll(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--sd-border)] text-[var(--sd-accent)]"
              />
              Add a Poll to this thread
            </label>
          </div>

          {addPoll && (
            <div className="pl-6 space-y-4 border-l-2 border-[var(--sd-accent)] ml-2">
              <Input 
                label="Poll Question" 
                placeholder="What do you think about...?" 
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                required={addPoll}
              />
              <Input 
                label="Poll Options (Comma separated)" 
                placeholder="e.g. Yes, No, Maybe" 
                value={pollOptionsInput}
                onChange={(e) => setPollOptionsInput(e.target.value)}
                required={addPoll}
              />
              <p className="text-xs text-[var(--sd-text-tertiary)]">Minimum 2 options required.</p>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-[var(--sd-border)]">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading} className="ml-auto" disabled={!user}>
              Publish Thread
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
