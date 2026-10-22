"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoard } from "@/context/BoardContext";
import { Card } from "@/types/kanban";
import { ColumnContainer } from "./ColumnContainer";
import { CardItemOverlay } from "./CardItem";
import { CardModal } from "./CardModal";

export function Board() {
  const { board, loading, error, moveCard, addCard, editCard, deleteCard, renameColumn, refetch } =
    useBoard();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    columnId?: string;
    columnTitle?: string;
    card?: Card;
  }>({
    isOpen: false,
    mode: "create",
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-text">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading board</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg bg-purple-secondary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-4 text-center max-w-md">
          <h3 className="text-lg font-semibold text-dark-navy mb-2">No board found</h3>
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg bg-purple-secondary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#622e7a] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);

    for (const col of board.columns) {
      const found = col.cards.find((c) => c.id === activeId);
      if (found) {
        setActiveCard(found);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let sourceColId = "";
    let sourceIndex = -1;

    for (const col of board.columns) {
      const idx = col.cards.findIndex((c) => c.id === activeId);
      if (idx !== -1) {
        sourceColId = col.id;
        sourceIndex = idx;
        break;
      }
    }

    if (!sourceColId) return;

    let destColId = "";
    let targetIndex = -1;

    const directCol = board.columns.find((col) => col.id === overId);
    if (directCol) {
      destColId = directCol.id;
      targetIndex = directCol.cards.length;
    } else {
      for (const col of board.columns) {
        const idx = col.cards.findIndex((c) => c.id === overId);
        if (idx !== -1) {
          destColId = col.id;
          targetIndex = idx;
          break;
        }
      }
    }

    if (!destColId) return;

    if (sourceColId === destColId && sourceIndex === targetIndex) {
      return;
    }

    moveCard(activeId, sourceColId, destColId, targetIndex);
  };

  const handleOpenAddModal = (columnId: string, columnTitle: string) => {
    setModalState({
      isOpen: true,
      mode: "create",
      columnId,
      columnTitle,
    });
  };

  const handleOpenEditModal = (card: Card) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      card,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveModal = (title: string, details: string) => {
    if (modalState.mode === "create" && modalState.columnId) {
      addCard(modalState.columnId, title, details);
    } else if (modalState.mode === "edit" && modalState.card) {
      editCard(modalState.card.id, title, details);
    }
  };

  const handleDeleteModal = () => {
    if (modalState.card) {
      deleteCard(modalState.card.id);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6">
      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="inline-flex h-[calc(100vh-140px)] min-h-[500px] gap-3 sm:gap-5 items-stretch">
          {board.columns.map((column) => (
            <ColumnContainer
              key={column.id}
              column={column}
              onRenameColumn={renameColumn}
              onAddCardClick={handleOpenAddModal}
              onEditCardClick={handleOpenEditModal}
              onDeleteCardClick={deleteCard}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? <CardItemOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {modalState.isOpen && (
        <CardModal
          key={
            modalState.mode === "edit"
              ? `edit-${modalState.card?.id}`
              : `create-${modalState.columnId}`
          }
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          initialCard={modalState.card}
          columnTitle={modalState.columnTitle}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          onDelete={handleDeleteModal}
        />
      )}
    </div>
  );
}
