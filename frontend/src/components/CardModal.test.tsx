import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardModal } from "./CardModal";

describe("CardModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CardModal
        isOpen={false}
        mode="create"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders create mode with empty fields", () => {
    render(
      <CardModal
        isOpen={true}
        mode="create"
        columnTitle="To Do"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Add New Card")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Implement user authentication/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create Card" })).toBeInTheDocument();
  });

  it("shows error when trying to submit without title", () => {
    const onSave = vi.fn();
    render(
      <CardModal
        isOpen={true}
        mode="create"
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Card" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with title and details on valid submit", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <CardModal
        isOpen={true}
        mode="create"
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Implement user authentication/i),
      { target: { value: "New Task Title" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Add relevant context/i),
      { target: { value: "Task details description" } }
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Card" }));
    expect(onSave).toHaveBeenCalledWith("New Task Title", "Task details description");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders edit mode with initial card data and delete button", () => {
    const onDelete = vi.fn();
    render(
      <CardModal
        isOpen={true}
        mode="edit"
        initialCard={{
          id: "c-1",
          title: "Existing Task",
          details: "Existing Details",
        }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Edit Card")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Card" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete Card" }));
    expect(onDelete).toHaveBeenCalled();
  });
});
