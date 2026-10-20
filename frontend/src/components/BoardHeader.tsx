"use client";

import React from "react";
import { useBoard } from "@/context/BoardContext";
import { useTheme } from "@/context/ThemeContext";

export function BoardHeader() {
  const { board } = useBoard();
  const { theme, toggleTheme } = useTheme();

  if (!board) {
    return (
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-xs dark:border-slate-800 dark:bg-[#0c1424] transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-slate-100">
                  Project Alpha Roadmap
                </h1>
              </div>
              <p className="text-xs text-gray-text dark:text-slate-400">
                Track, organize, and manage deliverables across all sprint stages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-[#162035] dark:text-cyan-300 dark:hover:bg-[#1e2c48] dark:hover:border-cyan-400/50 transition-all cursor-pointer select-none"
            >
              {theme === "light" ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 text-purple-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-cyan-300">Light Mode</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-gray-text font-medium dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-primary dark:bg-cyan-400 dark:shadow-[0_0_8px_#22d3ee]"></span>
              Single Board MVP
            </div>
          </div>
        </div>
      </header>
    );
  }

  const totalCards = board.columns.reduce(
    (acc, col) => acc + col.cards.length,
    0
  );

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-xs dark:border-slate-800 dark:bg-[#0c1424] transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-slate-100">
                {board.title}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-gray-text border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
                {totalCards} {totalCards === 1 ? "task" : "tasks"}
              </span>
            </div>
            <p className="text-xs text-gray-text dark:text-slate-400">
              Track, organize, and manage deliverables across all sprint stages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-[#162035] dark:text-cyan-300 dark:hover:bg-[#1e2c48] dark:hover:border-cyan-400/50 transition-all cursor-pointer select-none"
          >
            {theme === "light" ? (
              <>
                <svg
                  className="h-3.5 w-3.5 text-purple-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-cyan-300">Light Mode</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-gray-text font-medium dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-primary dark:bg-cyan-400 dark:shadow-[0_0_8px_#22d3ee]"></span>
            Single Board MVP
          </div>
        </div>
      </div>
    </header>
  );
}
