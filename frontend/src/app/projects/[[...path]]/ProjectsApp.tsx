"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BoardProvider } from "@/context/BoardContext";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { Board } from "@/components/Board";
import { BoardHeader } from "@/components/BoardHeader";

interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
}

/**
 * Resolves the URL of the projects namespace into a view.
 *
 *   /projects                              project list
 *   /projects/<slug>                      project detail
 *   /projects/<slug>/boards/<boardId>     board
 */
export function ProjectsApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectsRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

function ProjectsRoutes() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[1];
  const boardId = segments[2] === "boards" ? segments[3] : undefined;

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setProject(null);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    async function resolveProject() {
      const response = await fetch("/api/projects", { credentials: "include" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const match = (data.projects || []).find(
        (p: ProjectSummary) => p.slug === slug
      );
      if (cancelled) {
        return;
      }
      setProject(match || null);
      setNotFound(!match);
    }

    resolveProject();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!slug) {
    return <ProjectList />;
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <p className="text-sm text-gray-text">Project not found</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-text">Loading project...</p>
        </div>
      </div>
    );
  }

  const projectId = Number(project.id);

  if (boardId) {
    return (
      <BoardProvider boardId={boardId} projectId={projectId}>
        <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#070b14] transition-colors">
          <BoardHeader projectSlug={project.slug} projectTitle={project.title} />
          <Board />
        </main>
      </BoardProvider>
    );
  }

  return <ProjectDetail projectId={projectId} projectSlug={project.slug} />;
}
