import { describe, it, expect } from "vitest";
import { boardReducer, BoardAction } from "./boardReducer";
import { Board } from "@/types/kanban";

const sampleBoard: Board = {
  id: "b1",
  title: "Test Board",
  columns: [
    {
      id: "c1",
      title: "Column 1",
      cards: [
        { id: "k1", title: "Card 1", details: "Details 1" },
        { id: "k2", title: "Card 2", details: "Details 2" },
      ],
    },
    {
      id: "c2",
      title: "Column 2",
      cards: [{ id: "k3", title: "Card 3", details: "Details 3" }],
    },
  ],
};

describe("boardReducer", () => {
  it("adds a new card to a column", () => {
    const action: BoardAction = {
      type: "ADD_CARD",
      payload: {
        columnId: "c1",
        card: { title: "New Card", details: "New details" },
      },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards).toHaveLength(3);
    expect(newState.columns[0].cards[2].title).toBe("New Card");
    expect(newState.columns[0].cards[2].details).toBe("New details");
  });

  it("does not add a card with empty title", () => {
    const action: BoardAction = {
      type: "ADD_CARD",
      payload: {
        columnId: "c1",
        card: { title: "   ", details: "Details" },
      },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards).toHaveLength(2);
  });

  it("edits an existing card title and details", () => {
    const action: BoardAction = {
      type: "EDIT_CARD",
      payload: {
        cardId: "k1",
        title: "Updated Title",
        details: "Updated Details",
      },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards[0].title).toBe("Updated Title");
    expect(newState.columns[0].cards[0].details).toBe("Updated Details");
  });

  it("deletes a card", () => {
    const action: BoardAction = {
      type: "DELETE_CARD",
      payload: { cardId: "k1" },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards).toHaveLength(1);
    expect(newState.columns[0].cards[0].id).toBe("k2");
  });

  it("renames a column", () => {
    const action: BoardAction = {
      type: "RENAME_COLUMN",
      payload: { columnId: "c1", title: "Sprint Backlog" },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].title).toBe("Sprint Backlog");
  });

  it("does not rename a column with empty title", () => {
    const action: BoardAction = {
      type: "RENAME_COLUMN",
      payload: { columnId: "c1", title: "   " },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].title).toBe("Column 1");
  });

  it("moves a card within the same column", () => {
    const action: BoardAction = {
      type: "MOVE_CARD",
      payload: {
        cardId: "k1",
        sourceColumnId: "c1",
        destinationColumnId: "c1",
        newIndex: 1,
      },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards[0].id).toBe("k2");
    expect(newState.columns[0].cards[1].id).toBe("k1");
  });

  it("moves a card to a different column", () => {
    const action: BoardAction = {
      type: "MOVE_CARD",
      payload: {
        cardId: "k1",
        sourceColumnId: "c1",
        destinationColumnId: "c2",
        newIndex: 0,
      },
    };
    const newState = boardReducer(sampleBoard, action);
    expect(newState.columns[0].cards).toHaveLength(1);
    expect(newState.columns[0].cards[0].id).toBe("k2");
    expect(newState.columns[1].cards).toHaveLength(2);
    expect(newState.columns[1].cards[0].id).toBe("k1");
    expect(newState.columns[1].cards[1].id).toBe("k3");
  });
});
