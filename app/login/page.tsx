"use client";

import React, { useState } from "react";
import { LoginForm } from "../../components/app/LoginForm";
import apiClient from "../../lib/api-client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { refreshSession } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/auth/login", { email, password });
      await refreshSession();
      toast.success("Logged in successfully!");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
      <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
    </div>
  );
}
