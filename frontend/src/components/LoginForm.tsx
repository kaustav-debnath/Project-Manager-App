"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const success = await login(email, password);
    if (success) {
      window.location.href = "/";
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#032147] text-dark-navy">
      <div className="absolute top-4 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-8 w-1.5 rounded-full bg-accent-yellow" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            OmniRoute
          </h1>
        </div>
        <p className="text-gray-text text-sm mb-8">
          Sign in to access your Kanban board
        </p>

        {error && (
          <div role="alert" className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-text mb-1"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-text mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-purple-secondary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-text">
          New here?{" "}
          <a href="/register" className="font-semibold text-cyan-400 hover:underline">
            Create an account
          </a>
        </p>
        <p className="mt-3 text-center text-xs text-gray-text">
          Demo credentials: user@example.com / password
        </p>
      </div>
    </div>
  );
}
