"use client";

import React from "react";
import { NavBar } from "./app/NavBar";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export function GlobalNavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/threads?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <NavBar
      username={user?.username}
      email={user?.email}
      avatarUrl={user?.avatarUrl}
      userId={user?.id}
      isAdmin={user?.role === "ADMIN"}
      onLogin={handleLogin}
      onLogout={logout}
      onSearch={handleSearch}
    />
  );
}
