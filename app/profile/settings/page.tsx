"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/ui/Avatar";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import apiClient from "../../../lib/api-client";
import toast from "react-hot-toast";

export default function ProfileSettingsPage() {
  const { user, setUser, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [fetchingTeams, setFetchingTeams] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setFavoriteTeamId((user as any).favoriteTeamId || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchTeams = async () => {
      setFetchingTeams(true);
      try {
        const res = await apiClient.get("/teams");
        setTeams(res.data);
      } catch (err) {
        console.error("Failed to fetch teams", err);
      } finally {
        setFetchingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  /* ── Save username & favorite team ────────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.patch("/users/me", {
        username,
        favoriteTeamId: favoriteTeamId || null,
      });
      setUser(res.data);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Upload avatar ────────────────────────────────────── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await apiClient.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload avatar.");
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Remove avatar ────────────────────────────────────── */
  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const res = await apiClient.delete("/users/me/avatar");
      setUser(res.data);
      toast.success("Avatar removed.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove avatar.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-[var(--sd-text-secondary)]">Loading profile...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">You must be logged in to view this page.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6 mt-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)] hover:border-[var(--sd-accent)] transition-colors"
          style={{ cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--sd-text-primary)] tracking-tight">Profile Settings</h1>
      </div>

      {/* ── Avatar Section ───────────────────────────────── */}
      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--sd-text-secondary)] uppercase tracking-wider mb-4">Avatar</h2>

        <div className="flex items-center gap-5">
          <Avatar src={user.avatarUrl} name={user.username} size="lg" />

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </Button>
              {user.avatarUrl && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={uploading}
                  onClick={handleRemoveAvatar}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-[var(--sd-text-tertiary)]">JPG, PNG or GIF. Max 5 MB.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Profile Info Section ─────────────────────────── */}
      <form onSubmit={handleSave} className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-[var(--sd-text-secondary)] uppercase tracking-wider mb-2">Profile Info</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--sd-text-secondary)]">Email</label>
          <Input value={user.email} disabled className="opacity-50" />
        </div>

        {(user as any).authProvider === "GOOGLE" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--sd-bg-tertiary,var(--sd-bg-primary))] border border-[var(--sd-border)] text-sm text-[var(--sd-text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Signed in with Google
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--sd-text-secondary)]">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--sd-text-secondary)]">Favorite Team</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={fetchingTeams}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full h-[40px] px-[16px] text-left rounded-[var(--sd-radius-md)] border border-[var(--sd-border-strong)] bg-[var(--sd-bg-secondary)] text-[14px] text-[var(--sd-text-primary)] font-[var(--sd-font)] flex items-center justify-between transition-colors focus:outline-none focus:border-[var(--sd-accent)] disabled:opacity-50"
            >
              <span className="truncate">
                {fetchingTeams ? "Loading teams..." : (teams.find((t) => t.id === favoriteTeamId)?.name || "None")}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[var(--sd-text-tertiary)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-2 py-1 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-[var(--sd-radius-md)] shadow-lg max-h-60 overflow-y-auto">
                <div
                  onClick={() => {
                    setFavoriteTeamId("");
                    setDropdownOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer text-[14px] transition-colors ${!favoriteTeamId ? 'bg-[var(--sd-bg-tertiary,rgba(255,255,255,0.05))] text-[var(--sd-text-primary)] font-medium' : 'text-[var(--sd-text-secondary)] hover:bg-[var(--sd-bg-tertiary,rgba(255,255,255,0.05))] hover:text-[var(--sd-text-primary)]'}`}
                >
                  None
                </div>
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      setFavoriteTeamId(team.id);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer text-[14px] transition-colors ${favoriteTeamId === team.id ? 'bg-[var(--sd-bg-tertiary,rgba(255,255,255,0.05))] text-[var(--sd-text-primary)] font-medium' : 'text-[var(--sd-text-secondary)] hover:bg-[var(--sd-bg-tertiary,rgba(255,255,255,0.05))] hover:text-[var(--sd-text-primary)]'}`}
                  >
                    {team.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--sd-text-tertiary)] mt-1">
            Choose your favorite team to display on your profile.
          </p>
        </div>

        <div className="pt-3 border-t border-[var(--sd-border)] flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
