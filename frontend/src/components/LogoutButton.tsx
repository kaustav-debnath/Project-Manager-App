"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Redirect to login page after logout
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-gray-text font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-300"
    >
      <svg
        className="h-3.5 w-3.5 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.5 3.5H21M6 12h7.5M6 6v6.75a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V8.25A2.25 2.25 0 014.5 6h2.25"
        />
      </svg>
      <span>Log Out</span>
    </button>
  );
}
