"use client";

import React, { useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { TextArea } from "../../components/ui/TextArea";
import { Button } from "../../components/ui/Button";
import apiClient from "../../lib/api-client";
import toast from "react-hot-toast";

export default function AppealPage() {
  const { user } = useAuth();
  
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/appeals", { message });
      setSubmitted(true);
      toast.success("Appeal submitted successfully.");
    } catch (err: any) {
      if (err.response?.data?.error === "Appeal already pending") {
        toast.error("You already have a pending appeal.");
      } else {
        toast.error(err.response?.data?.error || "Failed to submit appeal.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 mt-8">
      <div className="bg-[var(--sd-bg-secondary)] border border-[var(--sd-border)] rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        
        <h1 className="text-2xl font-bold font-[var(--sd-font)] text-[var(--sd-text-primary)] mb-4">
          Account Restricted
        </h1>
        <p className="text-[var(--sd-text-secondary)] mb-6">
          Your account has been restricted due to violations of our community guidelines. 
          If you believe this was a mistake, or wish to appeal the decision, please fill out the form below.
        </p>

        {submitted ? (
          <div className="p-4 bg-[var(--sd-success-muted)] text-[var(--sd-success)] rounded-lg font-medium">
            Your appeal is currently under review by our moderation team. You will be notified of their decision.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <TextArea 
              label="Appeal Message" 
              placeholder="Explain why your account should be restored..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={submitting}>
                Submit Appeal
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
