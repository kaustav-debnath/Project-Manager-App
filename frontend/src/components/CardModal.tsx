"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/types/kanban";

interface CardModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialCard?: Card;
  columnTitle?: string;
  onClose: () => void;
  onSave: (title: string, details: string) => void;
  onDelete?: () => void;
}

export function CardModal({
  isOpen,
  mode,
  initialCard,
  columnTitle,
  onClose,
  onSave,
  onDelete,
}: CardModalProps) {
  const [title, setTitle] = useState(
    mode === "edit" && initialCard ? initialCard.title : ""
  );
  const [details, setDetails] = useState(
    mode === "edit" && initialCard ? initialCard.details : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    onSave(title.trim(), details.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 dark:bg-black/75 dark:backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200 dark:border-slate-700/80 dark:bg-[#0f172a] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-dark-navy dark:text-slate-100">
              {mode === "create" ? "Add New Card" : "Edit Card"}
            </h2>
            {columnTitle && (
              <p className="text-xs text-gray-text mt-0.5 dark:text-slate-400">
                Column: <span className="font-semibold text-slate-700 dark:text-cyan-300">{columnTitle}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="card-title"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy dark:text-slate-300"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Implement user authentication"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20 dark:border-slate-700 dark:bg-[#080d1a] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="card-details"
              className="block text-xs font-semibold uppercase tracking-wider text-dark-navy dark:text-slate-300"
            >
              Details
            </label>
            <textarea
              id="card-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add relevant context, acceptance criteria, or notes..."
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-primary focus:outline-hidden focus:ring-2 focus:ring-blue-primary/20 dark:border-slate-700 dark:bg-[#080d1a] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors"
                >
                  Delete Card
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-purple-secondary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] dark:bg-gradient-to-r dark:from-purple-600 dark:to-fuchsia-600 dark:hover:from-purple-500 dark:hover:to-fuchsia-500 dark:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
              >
                {mode === "create" ? "Create Card" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
