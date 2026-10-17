"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/types/kanban";

interface CardItemProps {
  card: Card;
  columnId: string;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export function CardItem({ card, columnId, onEdit, onDelete }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border-2 border-dashed border-blue-primary/40 bg-blue-50/30 p-3.5 opacity-60 min-h-[88px] dark:border-cyan-400/50 dark:bg-cyan-950/20"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(card)}
      className="group relative cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all select-none dark:border-slate-800/90 dark:bg-[#131d31] dark:hover:border-cyan-400/60 dark:hover:shadow-[0_0_18px_rgba(34,211,238,0.2)] dark:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-dark-navy leading-snug dark:text-slate-100">
          {card.title}
        </h3>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Edit ${card.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`Delete ${card.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      {card.details && (
        <p className="mt-2 text-xs text-gray-text line-clamp-2 leading-relaxed dark:text-slate-400">
          {card.details}
        </p>
      )}
    </div>
  );
}

export function CardItemOverlay({ card }: { card: Card }) {
  return (
    <div className="rotate-2 cursor-grabbing rounded-lg border-2 border-blue-primary bg-white p-3.5 shadow-xl select-none max-w-xs dark:border-cyan-400 dark:bg-[#131d31] dark:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
      <h3 className="text-sm font-semibold text-dark-navy leading-snug dark:text-slate-100">
        {card.title}
      </h3>
      {card.details && (
        <p className="mt-2 text-xs text-gray-text line-clamp-2 leading-relaxed dark:text-slate-400">
          {card.details}
        </p>
      )}
    </div>
  );
}
