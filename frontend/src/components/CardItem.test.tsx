import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardItem } from "./CardItem";
import { DndContext } from "@dnd-kit/core";

describe("CardItem", () => {
  const card = {
    id: "card-1",
    title: "Setup CI/CD",
    details: "Configure GitHub actions workflow",
  };

  it("renders card title and details", () => {
    render(
      <DndContext>
        <CardItem
          card={card}
          columnId="col-1"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </DndContext>
    );

    expect(screen.getByText("Setup CI/CD")).toBeInTheDocument();
    expect(screen.getByText("Configure GitHub actions workflow")).toBeInTheDocument();
  });

  it("calls onEdit when clicking card or edit button", () => {
    const onEdit = vi.fn();
    render(
      <DndContext>
        <CardItem
          card={card}
          columnId="col-1"
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      </DndContext>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Setup CI/CD" }));
    expect(onEdit).toHaveBeenCalledWith(card);
  });

  it("calls onDelete when clicking delete button", () => {
    const onDelete = vi.fn();
    render(
      <DndContext>
        <CardItem
          card={card}
          columnId="col-1"
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      </DndContext>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Setup CI/CD" }));
    expect(onDelete).toHaveBeenCalledWith("card-1");
  });
});
