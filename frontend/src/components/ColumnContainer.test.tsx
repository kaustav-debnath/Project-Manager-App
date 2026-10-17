import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnContainer } from "./ColumnContainer";
import { DndContext } from "@dnd-kit/core";
import { Column } from "@/types/kanban";

describe("ColumnContainer", () => {
  const column: Column = {
    id: "col-todo",
    title: "To Do",
    cards: [
      { id: "c-1", title: "Task 1", details: "Details 1" },
      { id: "c-2", title: "Task 2", details: "Details 2" },
    ],
  };

  it("renders column title and card count", () => {
    render(
      <DndContext>
        <ColumnContainer
          column={column}
          onRenameColumn={vi.fn()}
          onAddCardClick={vi.fn()}
          onEditCardClick={vi.fn()}
          onDeleteCardClick={vi.fn()}
        />
      </DndContext>
    );

    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("allows renaming column when clicking title", () => {
    const onRenameColumn = vi.fn();
    render(
      <DndContext>
        <ColumnContainer
          column={column}
          onRenameColumn={onRenameColumn}
          onAddCardClick={vi.fn()}
          onEditCardClick={vi.fn()}
          onDeleteCardClick={vi.fn()}
        />
      </DndContext>
    );

    fireEvent.click(screen.getByText("To Do"));
    const input = screen.getByLabelText("Edit column title");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Sprint Ready" } });
    fireEvent.blur(input);

    expect(onRenameColumn).toHaveBeenCalledWith("col-todo", "Sprint Ready");
  });

  it("calls onAddCardClick when clicking Add Card button", () => {
    const onAddCardClick = vi.fn();
    render(
      <DndContext>
        <ColumnContainer
          column={column}
          onRenameColumn={vi.fn()}
          onAddCardClick={onAddCardClick}
          onEditCardClick={vi.fn()}
          onDeleteCardClick={vi.fn()}
        />
      </DndContext>
    );

    fireEvent.click(screen.getByRole("button", { name: /Add Card/i }));
    expect(onAddCardClick).toHaveBeenCalledWith("col-todo", "To Do");
  });

  it("renders empty state when column has no cards", () => {
    const emptyCol: Column = {
      id: "col-empty",
      title: "Empty Column",
      cards: [],
    };
    render(
      <DndContext>
        <ColumnContainer
          column={emptyCol}
          onRenameColumn={vi.fn()}
          onAddCardClick={vi.fn()}
          onEditCardClick={vi.fn()}
          onDeleteCardClick={vi.fn()}
        />
      </DndContext>
    );

    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });
});
