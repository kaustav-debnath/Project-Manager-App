"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { validateEmail, validateName, validatePassword } from "@/lib/accountValidation";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20 dark:border-slate-700 dark:bg-[#080d1a] dark:text-slate-100";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gray-text mb-1";
const sectionClass = "rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1424]";

type Notice = { kind: "success" | "error"; text: string } | null;

export function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Signed-out visitors go to the sign-in page
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login";
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <p className="text-sm text-gray-text">Loading...</p>
      </div>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    setProfileErrors(errors);
    setProfileNotice(null);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    });
    setSavingProfile(false);

    if (response.ok) {
      await refreshUser();
      setProfileNotice({ kind: "success", text: "Profile updated" });
    } else {
      const data = await response.json().catch(() => ({}));
      setProfileNotice({ kind: "error", text: data.detail ?? "Could not update your profile" });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const newError = validatePassword(newPassword);
    if (!currentPassword) errors.currentPassword = "Enter your current password";
    if (newError) errors.newPassword = newError;
    if (!newError && newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    setPasswordErrors(errors);
    setPasswordNotice(null);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPassword(false);

    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({ kind: "success", text: "Password changed. You are signed out on other devices." });
    } else {
      const data = await response.json().catch(() => ({}));
      setPasswordNotice({ kind: "error", text: data.detail ?? "Could not change your password" });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-dark-navy dark:bg-[#070b14] dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1424]">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
            <div>
              <Breadcrumbs items={[{ label: "Projects", href: "/projects" }]} />
              <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-slate-100">Profile</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className={sectionClass} aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-lg font-semibold text-dark-navy dark:text-slate-100">
            Your details
          </h2>
          <form onSubmit={saveProfile} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="profile-name" className={labelClass}>Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
              {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="profile-email" className={labelClass}>Email</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
            </div>
            <Notice notice={profileNotice} />
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>

        <section className={sectionClass} aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-lg font-semibold text-dark-navy dark:text-slate-100">
            Change password
          </h2>
          <form onSubmit={changePassword} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="current-password" className={labelClass}>Current password</label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label htmlFor="new-password" className={labelClass}>New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className={labelClass}>Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <Notice notice={passwordNotice} />
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Notice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const tone =
    notice.kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-600";
  return (
    <div role={notice.kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm font-medium ${tone}`}>
      {notice.text}
    </div>
  );
}
