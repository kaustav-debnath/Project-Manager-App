"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  boardCount?: number;
}

export function ProjectList() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleCreateProject(title: string, description: string) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      await fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-text">Loading projects...</p>
        </div>
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
                Projects
              </h1>
              <p className="text-xs text-gray-text dark:text-slate-400">
                Select a project to view its boards
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              New Project
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
              onClick={fetchProjects}
              className="rounded-lg bg-purple-secondary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-[#0c1424]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg
                className="h-8 w-8 text-gray-text"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m4 10V4m4 13v-6M5 17h14"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-navy dark:text-slate-100 mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-gray-text dark:text-slate-400 mb-6">
              Create your first project to get started
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.slug}`)}
                onDelete={fetchProjects}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateProject}
          submitting={submitting}
        />
      )}
    </div>
  );
}