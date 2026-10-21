"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface Project {
  id: string;
  title: string;
  description: string;
}

export function ProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to delete project");
    }
    setConfirmingDelete(false);
    onDelete();
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-blue-primary hover:shadow-md dark:border-slate-800 dark:bg-[#0c1424] dark:hover:border-cyan-400/60"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-primary/10 text-blue-primary dark:bg-cyan-400/10 dark:text-cyan-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 8.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25 2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            aria-label={`Delete ${project.title}`}
            className="rounded-md p-1.5 text-gray-text transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>

        <h3 className="mb-1 text-base font-semibold text-dark-navy group-hover:text-blue-primary dark:text-slate-100 dark:group-hover:text-cyan-400">
          {project.title}
        </h3>
        {project.description && (
          <p className="line-clamp-2 text-sm text-gray-text dark:text-slate-400">
            {project.description}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmingDelete}
        title="Delete project"
        message={`"${project.title}" and all of its boards will be permanently deleted.`}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
