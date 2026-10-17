"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Board } from "@/types/kanban";
import { initialBoard } from "@/data/dummyData";
import { boardReducer } from "./boardReducer";

interface BoardContextType {
  board: Board;
  moveCard: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newIndex: number
  ) => void;
  addCard: (columnId: string, title: string, details: string) => void;
  editCard: (cardId: string, title: string, details: string) => void;
  deleteCard: (cardId: string) => void;
  renameColumn: (columnId: string, title: string) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({
  children,
  initialState = initialBoard,
}: {
  children: ReactNode;
  initialState?: Board;
}) {
  const [board, dispatch] = useReducer(boardReducer, initialState);

  const moveCard = (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newIndex: number
  ) => {
    dispatch({
      type: "MOVE_CARD",
      payload: { cardId, sourceColumnId, destinationColumnId, newIndex },
    });
  };

  const addCard = (columnId: string, title: string, details: string) => {
    dispatch({
      type: "ADD_CARD",
      payload: { columnId, card: { title, details } },
    });
  };

  const editCard = (cardId: string, title: string, details: string) => {
    dispatch({
      type: "EDIT_CARD",
      payload: { cardId, title, details },
    });
  };

  const deleteCard = (cardId: string) => {
    dispatch({
      type: "DELETE_CARD",
      payload: { cardId },
    });
  };

  const renameColumn = (columnId: string, title: string) => {
    dispatch({
      type: "RENAME_COLUMN",
      payload: { columnId, title },
    });
  };

  return (
    <BoardContext.Provider
      value={{
        board,
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
