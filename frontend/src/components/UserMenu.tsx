"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-primary text-xs font-bold text-white shadow-2xs hover:bg-blue-primary/90 focus:outline-hidden focus:ring-2 focus:ring-blue-primary/40 transition-all cursor-pointer dark:bg-cyan-500 dark:text-[#032147]"
      >
        {initialsFor(user.name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#0f172a]"
        >
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="truncate text-sm font-semibold text-dark-navy dark:text-slate-100">{user.name}</p>
            <p className="truncate text-xs text-gray-text dark:text-slate-400">{user.email}</p>
          </div>
          <a
            role="menuitem"
            href="/profile"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#162035]"
          >
            Profile
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#162035]"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
