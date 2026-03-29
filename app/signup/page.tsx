"use client";

import React, { useState } from "react";
import { SignupForm } from "../../components/app/SignupForm";
import apiClient from "../../lib/api-client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { refreshSession } = useAuth();

  const handleSignup = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/auth/register", { username, email, password });
      await refreshSession();
      toast.success("Account created successfully!");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
      toast.error("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
      <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
    </div>
  );
}
