import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Board } from "./Board";
import { BoardProvider } from "@/context/BoardContext";
import { Board as BoardType } from "@/types/kanban";

const initialBoard: BoardType = {
  id: "b-1",
  title: "Development Board",
  columns: [
    {
      id: "col-1",
      title: "Column A",
      cards: [{ id: "c-1", title: "Task A", details: "Detail A" }],
    },
    {
      id: "col-2",
      title: "Column B",
      cards: [],
    },
  ],
};

describe("Board component", () => {
  it("renders all columns and cards", async () => {
    render(
      <BoardProvider board={initialBoard}>
        <Board />
      </BoardProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading board...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Column A")).toBeInTheDocument();
    expect(screen.getByText("Column B")).toBeInTheDocument();
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });

  it("opens modal and adds a new card to a column", async () => {
    render(
      <BoardProvider board={initialBoard}>
        <Board />
      </BoardProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading board...")).not.toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /Add Card/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText("Add New Card")).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Implement user authentication/i);
    fireEvent.change(titleInput, { target: { value: "Brand New Feature" } });

    const submitBtn = screen.getByRole("button", { name: "Create Card" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Brand New Feature")).toBeInTheDocument();
  });

  it("opens modal and edits an existing card", async () => {
    render(
      <BoardProvider board={initialBoard}>
        <Board />
      </BoardProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading board...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Task A" }));

    expect(screen.getByText("Edit Card")).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue("Task A");
    fireEvent.change(titleInput, { target: { value: "Task A Modified" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Task A Modified")).toBeInTheDocument();
  });

  it("deletes a card via card delete button", async () => {
    render(
      <BoardProvider board={initialBoard}>
        <Board />
      </BoardProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading board...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Task A")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete Task A" }));

    expect(screen.queryByText("Task A")).not.toBeInTheDocument();
  });
});