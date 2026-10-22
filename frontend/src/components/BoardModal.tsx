"use client";

import React, { useEffect, useRef, useState } from "react";

export function BoardModal({
  isOpen,
  onClose,
  onSave,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  submitting: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      titleRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#0c1424] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-dark-navy dark:text-slate-100 mb-6">
          Create Board
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(title);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-text mb-1">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Board"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-primary focus:border-blue-primary outline-none dark:border-slate-800 dark:bg-[#162035] dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-text bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || submitting}
              className="rounded-lg bg-purple-secondary px-4 py-2 text-sm font-semibold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#622e7a] transition-all cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}