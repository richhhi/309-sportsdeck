"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Pagination } from "../../../components/ui/Pagination";
import apiClient from "../../../lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────── */

interface BasicProfile {
  id: string;
  username: string;
  avatarUrl: string;
  favoriteTeamId?: string;
  favoriteTeam?: { name: string; crest: string };
  isBanned?: boolean;
}

interface ActivityDataPoint {
  date: string;
  threadCount: number;
  postCount: number;
}

interface RecentThread {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isHidden: boolean;
}

interface FollowUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface RecentPost {
  id: string;
  threadId: string;
  content: string;
  createdAt: string;
  isHidden: boolean;
}

/* ── Component ─────────────────────────────────────────── */

export default function ProfilePage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<BasicProfile | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [followersList, setFollowersList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followersPage, setFollowersPage] = useState(1);
  const [followersTotalPages, setFollowersTotalPages] = useState(1);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followingPage, setFollowingPage] = useState(1);
  const [followingTotalPages, setFollowingTotalPages] = useState(1);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "followers" | "following">("activity");

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        // Fire all requests in parallel
        const [profileRes, activityRes] =
          await Promise.all([
            apiClient.get(`/users/${id}`),
            apiClient.get(`/users/${id}/activity`),
          ]);

        // Basic profile
        setProfile(profileRes.data);
        setIsBanned(!!profileRes.data.isBanned);

        // Activity chart data — always show the past 15 days
        const rawActivity: ActivityDataPoint[] = Array.isArray(activityRes.data) ? activityRes.data : [];
        const activityMap = new Map(rawActivity.map((d) => [d.date, d]));
        const padded: ActivityDataPoint[] = [];
        const today = new Date();
        for (let i = 14; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          padded.push(activityMap.get(key) ?? { date: key, threadCount: 0, postCount: 0 });
        }
        setActivityData(padded);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const fetchFollowers = async () => {
      setLoadingFollowers(true);
      try {
        const followersRes = await apiClient.get(`/users/${id}/followers?page=${followersPage}&limit=10`);
        const followersData = followersRes.data;
        setFollowersCount(followersData.pagination?.totalItems ?? 0);
        setFollowersTotalPages(followersData.pagination?.totalPages || 1);

        const followerUsers: FollowUser[] = (followersData.data ?? []).map((f: any) => ({
          id: f.follower?.id ?? f.followerId,
          username: f.follower?.username ?? "Unknown",
          avatarUrl: f.follower?.avatarUrl ?? null,
        }));
        setFollowersList(followerUsers);
        if (user?.id) {
          setIsFollowing(followerUsers.some((u) => u.id === user.id));
        }
      } catch (err) {
        console.error("Failed to fetch followers", err);
      } finally {
        setLoadingFollowers(false);
      }
    };
    fetchFollowers();
  }, [id, followersPage, user?.id]);

  useEffect(() => {
    if (!id) return;
    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      try {
        const followingRes = await apiClient.get(`/users/${id}/following?page=${followingPage}&limit=10`);
        const followingData = followingRes.data;
        setFollowingCount(followingData.pagination?.totalItems ?? 0);
        setFollowingTotalPages(followingData.pagination?.totalPages || 1);

        setFollowingList((followingData.data ?? []).map((f: any) => ({
          id: f.following?.id ?? f.followingId,
          username: f.following?.username ?? "Unknown",
          avatarUrl: f.following?.avatarUrl ?? null,
        })));
      } catch (err) {
        console.error("Failed to fetch following", err);
      } finally {
        setLoadingFollowing(false);
      }
    };
    fetchFollowing();
  }, [id, followingPage]);

  useEffect(() => {
    if (!id) return;
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const postsRes = await apiClient.get(`/users/${id}/posts?page=${postsPage}&limit=5`);
        const postsData = postsRes.data;
        setRecentActivity(postsData.data ?? []);
        setPostsTotalPages(postsData.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch user posts", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, [id, postsPage]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await apiClient.delete(`/users/${id}/followers`);
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
        toast.success("Unfollowed user");
      } else {
        await apiClient.post(`/users/${id}/followers`);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        toast.success("Followed user");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    try {
      await apiClient.delete(`/users/me/followers/${followerId}`);
      toast.success("Follower removed");

      // Update local state
      setFollowersCount(prev => prev - 1);
      setFollowersList(prev => prev.filter(f => f.id !== followerId));
    } catch (err) {
      toast.error("Failed to remove follower");
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--sd-text-secondary)]">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found.</div>;

  const isOwnProfile = user?.id === profile.id;
  const isAdmin = user?.role === "ADMIN";

  const handleBanToggle = async () => {
    if (!profile) return;
    try {
      if (isBanned) {
        await apiClient.post(`/users/${id}/unban`);
        setIsBanned(false);
        toast.success("User unbanned");
      } else {
        await apiClient.post(`/users/${id}/ban`);
        setIsBanned(true);
        toast.success("User banned");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative shadow-sm">
        <div className="flex-shrink-0">
          <Avatar src={profile.avatarUrl} name={profile.username} size="lg" />
        </div>

        <div className="flex-grow text-center md:text-left">
          <h1 className="text-3xl font-bold text-[var(--sd-text-primary)] mb-2 tracking-tight">
            {profile.username}
            {isBanned && (
              <span className="ml-2 text-xs font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 align-middle">
                Banned
              </span>
            )}
          </h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[var(--sd-text-secondary)] text-sm mb-4">
            <span
              onClick={() => setActiveTab("followers")}
              className="cursor-pointer hover:underline"
            >
              <strong>{followersCount}</strong> Followers
            </span>
            <span
              onClick={() => setActiveTab("following")}
              className="cursor-pointer hover:underline"
            >
              <strong>{followingCount}</strong> Following
            </span>
            {profile.favoriteTeam && (
              <span className="flex items-center gap-1">
                Favorite Team: <strong className="text-[var(--sd-text-primary)]">{profile.favoriteTeam.name}</strong>
              </span>
            )}
          </div>

          <div className="flex justify-center md:justify-start gap-3">
            {!isOwnProfile && (
              <Button variant={isFollowing ? "secondary" : "primary"} onClick={handleFollowToggle}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
            {isOwnProfile && (
              <Button variant="secondary" onClick={() => router.push('/profile/settings')}>
                Edit Profile
              </Button>
            )}
            {isOwnProfile && isBanned && (
              <Button variant="danger" onClick={() => router.push('/appeal')}>
                Appeal Ban
              </Button>
            )}
            {isAdmin && !isOwnProfile && (
              <Button variant="danger" onClick={handleBanToggle}>
                {isBanned ? "Unban" : "Ban"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--sd-border)]">
        {["activity", "followers", "following"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-2 text-sm font-medium capitalize transition-colors ${activeTab === tab
              ? "text-[var(--sd-accent)] border-b-2 border-[var(--sd-accent)]"
              : "text-[var(--sd-text-secondary)] hover:text-[var(--sd-text-primary)]"
              }`}
            style={{ cursor: 'pointer' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "activity" && (
          <div className="space-y-8">
            {/* Activity Chart */}
            <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--sd-text-primary)] mb-4">Activity Timeline</h3>
              {activityData.length > 0 ? (
                <div className="h-64 w-full text-[var(--sd-text-secondary)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <XAxis dataKey="date" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} tick={false} />
                      <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--sd-bg-primary)', border: '1px solid var(--sd-border)', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="threadCount" name="Threads" stroke="var(--sd-accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="postCount" name="Posts" stroke="var(--sd-text-secondary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-[var(--sd-text-tertiary)] text-sm">No activity data yet.</p>
              )}
            </div>

            {/* Recent Posts / Threads */}
            <div>
              <h3 className="text-lg font-bold text-[var(--sd-text-primary)] mb-4">Recent Posts</h3>
              {recentActivity.length ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <a
                      href={`/threads/${item.type === "thread" ? item.id : item.threadId}`}
                      key={`${item.type}-${item.id}`}
                      className="block bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl p-4 hover:border-[var(--sd-accent)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${item.type === "thread" ? "bg-[var(--sd-accent)]/10 text-[var(--sd-accent)]" : "bg-[var(--sd-text-secondary)]/10 text-[var(--sd-text-secondary)]"}`}>
                          {item.type === "thread" ? "Thread" : "Reply"}
                        </span>
                        <span className="text-xs text-[var(--sd-text-tertiary)]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.type === "thread" && "title" in item && (
                        <h4 className="text-sm font-semibold text-[var(--sd-text-primary)] mb-1">{item.title}</h4>
                      )}
                      <p className="text-sm text-[var(--sd-text-secondary)] line-clamp-2">{item.content}</p>
                    </a>
                  ))}
                  <div className="pt-4 border-t border-[var(--sd-border)] mt-6">
                    <Pagination
                      currentPage={postsPage}
                      totalPages={postsTotalPages}
                      onPageChange={(page) => setPostsPage(page)}
                      disabled={loadingPosts}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[var(--sd-text-tertiary)] text-sm">No recent activity.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "followers" && (
          <div className="space-y-3">
            {followersList.length ? followersList.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl p-3 hover:border-[var(--sd-accent)] transition-colors group">
                <a href={`/profile/${u.id}`} className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} name={u.username} size="sm" />
                  <span className="text-sm font-medium text-[var(--sd-text-primary)]">{u.username}</span>
                </a>
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFollower(u.id);
                    }}
                    className="text-xs font-semibold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20"
                    style={{ cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )) : (
              <p className="text-[var(--sd-text-tertiary)] text-sm">No followers yet.</p>
            )}
            {followersTotalPages > 1 && (
              <div className="pt-4 border-t border-[var(--sd-border)] mt-6">
                <Pagination
                  currentPage={followersPage}
                  totalPages={followersTotalPages}
                  onPageChange={(page) => setFollowersPage(page)}
                  disabled={loadingFollowers}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div className="space-y-3">
            {followingList.length ? followingList.map((u) => (
              <a key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-xl p-3 hover:border-[var(--sd-accent)] transition-colors">
                <Avatar src={u.avatarUrl} name={u.username} size="sm" />
                <span className="text-sm font-medium text-[var(--sd-text-primary)]">{u.username}</span>
              </a>
            )) : (
              <p className="text-[var(--sd-text-tertiary)] text-sm">Not following anyone yet.</p>
            )}
            {followingTotalPages > 1 && (
              <div className="pt-4 border-t border-[var(--sd-border)] mt-6">
                <Pagination
                  currentPage={followingPage}
                  totalPages={followingTotalPages}
                  onPageChange={(page) => setFollowingPage(page)}
                  disabled={loadingFollowing}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
