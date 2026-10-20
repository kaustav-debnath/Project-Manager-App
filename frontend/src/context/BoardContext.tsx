"use client";

import React, { createContext, useContext, useReducer, useState, useEffect, useCallback, ReactNode } from "react";
import { Board } from "@/types/kanban";
import { initialBoard } from "@/data/dummyData";
import { boardReducer } from "./boardReducer";

interface BoardContextType {
  board: Board;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  moveCard: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newIndex: number
  ) => Promise<void>;
  addCard: (columnId: string, title: string, details: string) => Promise<void>;
  editCard: (cardId: string, title: string, details: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  renameColumn: (columnId: string, title: string) => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

// Convert backend integer IDs to frontend string IDs
function convertBoardFromApi(data: any): Board {
  return {
    id: String(data.board.id),
    title: data.board.title,
    columns: data.board.columns.map((col: any) => ({
      id: String(col.id),
      title: col.title,
      position: col.position,
      cards: col.cards.map((card: any) => ({
        id: String(card.id),
        title: card.title,
        details: card.details,
      })),
    })),
  };
}

export function BoardProvider({
  children,
  board: initialBoardProp,
}: {
  children: ReactNode;
  board?: Board;
}) {
  const [board, dispatch] = useReducer(boardReducer, initialBoardProp ?? initialBoard);
  const [loading, setLoading] = useState(!initialBoardProp);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/board", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load board");
      }
      const data = await response.json();
      const convertedBoard = convertBoardFromApi(data);
      dispatch({ type: "SET_BOARD", payload: convertedBoard });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBoardProp) {
      fetchBoard();
    }
  }, [fetchBoard, initialBoardProp]);

  const moveCard = useCallback(
    async (cardId: string, sourceColumnId: string, destinationColumnId: string, newIndex: number) => {
      // Optimistic local update
      dispatch({
        type: "MOVE_CARD",
        payload: { cardId, sourceColumnId, destinationColumnId, newIndex },
      });
      try {
        await fetch(`/api/board/card/${Number(cardId)}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            newColumnId: Number(destinationColumnId),
            newPosition: newIndex,
          }),
        });
      } catch (err) {
        await fetchBoard();
        throw err;
      }
    },
    [fetchBoard]
  );

  const addCard = useCallback(
    async (columnId: string, title: string, details: string) => {
      dispatch({
        type: "ADD_CARD",
        payload: { columnId, card: { title, details } },
      });
      try {
        await fetch("/api/board/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            columnId: Number(columnId),
            title,
            details,
          }),
        });
        // Re-fetch to get the correct card ID from the backend
        await fetchBoard();
      } catch (err) {
        await fetchBoard();
        throw err;
      }
    },
    [fetchBoard]
  );

  const editCard = useCallback(
    async (cardId: string, title: string, details: string) => {
      dispatch({
        type: "EDIT_CARD",
        payload: { cardId, title, details },
      });
      try {
        await fetch(`/api/board/card/${Number(cardId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, details }),
        });
      } catch (err) {
        await fetchBoard();
        throw err;
      }
    },
    [fetchBoard]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      dispatch({
        type: "DELETE_CARD",
        payload: { cardId },
      });
      try {
        await fetch(`/api/board/card/${Number(cardId)}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (err) {
        await fetchBoard();
        throw err;
      }
    },
    [fetchBoard]
  );

  const renameColumn = useCallback(
    async (columnId: string, title: string) => {
      dispatch({
        type: "RENAME_COLUMN",
        payload: { columnId, title },
      });
      try {
        await fetch(`/api/board/column/${Number(columnId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title }),
        });
      } catch (err) {
        await fetchBoard();
        throw err;
      }
    },
    [fetchBoard]
  );

  return (
    <BoardContext.Provider
      value={{
        board,
        loading,
        error,
        refetch: fetchBoard,
        moveCard,
        addCard,
        editCard,
        deleteCard,
        renameColumn,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}