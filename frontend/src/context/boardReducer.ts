import { Board, Card } from "@/types/kanban";

export type BoardAction =
  | {
      type: "MOVE_CARD";
      payload: {
        cardId: string;
        sourceColumnId: string;
        destinationColumnId: string;
        newIndex: number;
      };
    }
  | {
      type: "ADD_CARD";
      payload: {
        columnId: string;
        card: { title: string; details: string };
      };
    }
  | {
      type: "DELETE_CARD";
      payload: {
        cardId: string;
      };
    }
  | {
      type: "EDIT_CARD";
      payload: {
        cardId: string;
        title: string;
        details: string;
      };
    }
  | {
      type: "RENAME_COLUMN";
      payload: {
        columnId: string;
        title: string;
      };
    }
  | {
      type: "SET_BOARD";
      payload: Board;
    };

export function boardReducer(state: Board, action: BoardAction): Board {
  switch (action.type) {
    case "MOVE_CARD": {
      const { cardId, sourceColumnId, destinationColumnId, newIndex } =
        action.payload;
      const sourceCol = state.columns.find((col) => col.id === sourceColumnId);
      const destCol = state.columns.find((col) => col.id === destinationColumnId);
      if (!sourceCol || !destCol) return state;

      const cardIndex = sourceCol.cards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;

      const card = sourceCol.cards[cardIndex];

      if (sourceColumnId === destinationColumnId) {
        if (cardIndex === newIndex) return state;
        const newCards = [...sourceCol.cards];
        newCards.splice(cardIndex, 1);
        newCards.splice(newIndex, 0, card);
        return {
          ...state,
          columns: state.columns.map((col) =>
            col.id === sourceColumnId ? { ...col, cards: newCards } : col
          ),
        };
      }

      // Moving across different columns
      const newSourceCards = sourceCol.cards.filter((c) => c.id !== cardId);
      const newDestCards = [...destCol.cards];
      const targetIndex = Math.max(0, Math.min(newIndex, newDestCards.length));
      newDestCards.splice(targetIndex, 0, card);

      return {
        ...state,
        columns: state.columns.map((col) => {
          if (col.id === sourceColumnId) return { ...col, cards: newSourceCards };
          if (col.id === destinationColumnId) return { ...col, cards: newDestCards };
          return col;
        }),
      };
    }

    case "ADD_CARD": {
      const { columnId, card } = action.payload;
      const targetCol = state.columns.find((c) => c.id === columnId);
      if (!targetCol) return state;

      const title = card.title.trim();
      if (!title) return state;

      const newCard: Card = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        details: card.details.trim(),
      };

      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
        ),
      };
    }

    case "DELETE_CARD": {
      const { cardId } = action.payload;
      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== cardId),
        })),
      };
    }

    case "EDIT_CARD": {
      const { cardId, title, details } = action.payload;
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return state;

      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c.id === cardId
              ? { ...c, title: trimmedTitle, details: details.trim() }
              : c
          ),
        })),
      };
    }

    case "RENAME_COLUMN": {
      const { columnId, title } = action.payload;
      const trimmed = title.trim();
      if (!trimmed) return state;

      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === columnId ? { ...col, title: trimmed } : col
        ),
      };
    }

    case "SET_BOARD":
      return action.payload;

    default:
      return state;
  }
}
