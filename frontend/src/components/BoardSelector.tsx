"use client";

import React, { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface Board {
  id: string;
  title: string;
}

export function BoardSelector({
  board,
  projectId,
  onClick,
  onDelete,
}: {
  board: Board;
  projectId: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    const response = await fetch(
      `/api/projects/${projectId}/boards/${board.id}`,
      { method: "DELETE", credentials: "include" }
    );
    if (!response.ok) {
      throw new Error("Failed to delete board");
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10-2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6a2 2 0 012-2zm0 14v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2zM5 9V7a5 5 0 0110 0v2a2 2 0 012 2h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            aria-label={`Delete ${board.title}`}
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
        <h3 className="text-base font-semibold text-dark-navy group-hover:text-blue-primary dark:text-slate-100 dark:group-hover:text-cyan-400">
          {board.title}
        </h3>
      </div>

      <ConfirmDialog
        isOpen={confirmingDelete}
        title="Delete board"
        message={`"${board.title}" and all of its cards will be permanently deleted.`}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
