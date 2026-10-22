"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BoardSelector } from "./BoardSelector";
import { BoardModal } from "./BoardModal";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

interface Project {
  id: string;
  title: string;
  description: string;
  boardCount?: number;
  boards: Board[];
}

interface Board {
  id: string;
  title: string;
  columnCount?: number;
}

export function ProjectDetail({
  projectId,
  projectSlug,
}: {
  projectId: number;
  projectSlug: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchProject() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load project");
      }
      const data = await response.json();
      setProject(data.project);
      setBoards(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProject();
  }, []);

  async function handleCreateBoard(title: string) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error("Failed to create board");
      }
      await fetchProject();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-text">Loading boards...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-[#0c1424]">
        <p className="text-sm text-gray-dark dark:text-slate-400">
          Project not found
        </p>
        <button
          type="button"
          onClick={fetchProject}
          className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1424] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-accent-yellow dark:bg-[#ffd600] dark:shadow-[0_0_12px_#ffd600]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-dark-navy dark:text-slate-100">
                {project.title}
              </h1>
              <p className="text-xs text-gray-text dark:text-slate-400">
                {project.description || ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              New Board
            </button>
            <LogoutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center max-w-md mb-6">
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchProject}
              className="rounded-lg bg-purple-secondary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardSelector
              key={board.id}
              board={board}
              projectId={projectId}
              onClick={() =>
                router.push(`/projects/${projectSlug}/boards/${board.id}`)
              }
              onDelete={fetchProject}
            />
          ))}
        </div>

        {isModalOpen && (
          <BoardModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleCreateBoard}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  );
}