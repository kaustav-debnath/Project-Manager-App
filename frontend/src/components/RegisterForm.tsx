"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { validateRegistration } from "@/lib/accountValidation";
import { ThemeToggle } from "./ThemeToggle";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm bg-white text-slate-800 placeholder-slate-400 dark:bg-transparent dark:text-white focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gray-text mb-1";

export function RegisterForm() {
  const { user, isLoading, register } = useAuth();
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Signed-in visitors have no reason to register again
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/projects";
    }
  }, [isLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const values = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    };

    const errors = validateRegistration(values);
    setFieldErrors(errors);
    setServerError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const error = await register(values.name.trim(), values.email.trim(), values.password);
    setSubmitting(false);
    if (error) {
      setServerError(error);
    } else {
      window.location.href = "/projects";
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-dark-navy dark:bg-[#032147]">
      <div className="absolute top-4 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-8 w-1.5 rounded-full bg-accent-yellow" />
          <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-white">Create your account</h1>
        </div>
        <p className="text-gray-text text-sm mb-8 text-center">
          Start with a sample project and make it your own
        </p>

        {serverError && (
          <div role="alert" className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="name" label="Name" error={fieldErrors.name}>
            <input id="name" name="name" type="text" autoComplete="name" className={inputClass} />
          </Field>
          <Field id="email" label="Email" error={fieldErrors.email}>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </Field>
          <Field id="password" label="Password" error={fieldErrors.password} hint="At least 8 characters">
            <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} />
          </Field>
          <Field id="confirmPassword" label="Confirm password" error={fieldErrors.confirmPassword}>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-purple-secondary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-text">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-blue-primary hover:underline dark:text-cyan-400">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-text">{hint}</p>
      ) : null}
    </div>
  );
}
