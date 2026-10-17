"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column, Card } from "@/types/kanban";
import { CardItem } from "./CardItem";

interface ColumnContainerProps {
  column: Column;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onAddCardClick: (columnId: string, columnTitle: string) => void;
  onEditCardClick: (card: Card) => void;
  onDeleteCardClick: (cardId: string) => void;
}

export function ColumnContainer({
  column,
  onRenameColumn,
  onAddCardClick,
  onEditCardClick,
  onDeleteCardClick,
}: ColumnContainerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed);
    } else {
      setTitleValue(column.title);
    }
  };

  const cardIds = column.cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-80 shrink-0 flex-col rounded-xl border bg-slate-100/70 p-3 transition-all dark:bg-[#0c1424]/90 dark:border-slate-800/90 ${
        isOver
          ? "border-blue-primary/60 bg-blue-50/20 dark:border-cyan-400 dark:bg-cyan-950/25 dark:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          : "border-slate-200/80 shadow-2xs"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex flex-1 items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitleValue(column.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="w-full rounded border border-blue-primary bg-white px-2 py-0.5 text-sm font-semibold text-dark-navy focus:outline-hidden dark:border-cyan-400 dark:bg-[#151f33] dark:text-slate-100"
              aria-label="Edit column title"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 text-left text-sm font-bold text-dark-navy hover:text-blue-primary dark:text-slate-100 dark:hover:text-cyan-300 transition-colors"
              title="Click to rename column"
            >
              <span>{column.title}</span>
              <svg
                className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 transition-opacity"
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
          )}
        </div>
        <span className="ml-2 rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-cyan-300 dark:border dark:border-slate-700/80">
          {column.cards.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="mt-2 flex flex-1 flex-col gap-2.5 overflow-y-auto px-0.5 py-1 min-h-[140px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              columnId={column.id}
              onEdit={onEditCardClick}
              onDelete={onDeleteCardClick}
            />
          ))}
        </SortableContext>

        {column.cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300/80 p-4 text-center dark:border-slate-800">
            <p className="text-xs text-gray-text dark:text-slate-500 font-medium">No cards yet</p>
          </div>
        )}
      </div>

      {/* Add Card Footer */}
      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onAddCardClick(column.id, column.title)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-blue-primary hover:shadow-2xs transition-all border border-transparent hover:border-slate-200 dark:text-slate-400 dark:hover:bg-[#151f33] dark:hover:text-cyan-300 dark:hover:border-slate-700/80"
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
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Card
        </button>
      </div>
    </div>
  );
}
