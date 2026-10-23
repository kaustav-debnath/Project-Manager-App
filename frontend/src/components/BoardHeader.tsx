"use client";

import React from "react";
import { useBoard } from "@/context/BoardContext";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function BoardHeader({
  projectSlug,
  projectTitle,
}: {
  projectSlug?: string | null;
  projectTitle?: string | null;
}) {
  const { board } = useBoard();

  if (!board) {
    return (
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1424] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
            <div>
              <Breadcrumbs items={[{ label: "Projects", href: "/projects" }]} />
              <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-slate-100">
                Board
              </h1>
              <p className="text-xs text-gray-text dark:text-slate-400">
                Track, organize, and manage deliverables across all sprint stages
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
    );
  }

  const totalCards = board.columns.reduce((acc, col) => acc + col.cards.length, 0);

  const crumbs = [{ label: "Projects", href: "/projects" }];
  if (projectSlug) {
    crumbs.push({ label: projectTitle || "Project", href: `/projects/${projectSlug}` });
  }

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1424] transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-8 w-1.5 shrink-0 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
          <div className="min-w-0">
            <Breadcrumbs items={crumbs} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
