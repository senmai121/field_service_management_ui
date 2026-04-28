"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <svg width="36" height="36" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 1L19 10L10 19L1 10L10 1Z" fill="#fbbf24" />
              <path d="M10 5.5L14.5 10L10 14.5L5.5 10L10 5.5Z" fill="#020617" />
            </svg>
          </div>
          <h1
            className="text-[44px] leading-none text-amber-400"
            style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}
          >
            Field Service
          </h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Management System
          </p>
        </div>

        {/* Form */}
        <div className="border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Create Account
            </p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="username" className="fsm-label">Username</label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="fsm-input"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="email" className="fsm-label">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fsm-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="fsm-label">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fsm-input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="fsm-btn-primary mt-1 w-full"
              >
                {isLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-amber-400 hover:text-amber-300">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
