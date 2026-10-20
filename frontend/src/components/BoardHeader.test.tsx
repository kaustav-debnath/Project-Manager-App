import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoardHeader } from "./BoardHeader";
import { BoardProvider } from "@/context/BoardContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Board } from "@/types/kanban";

const testBoard: Board = {
  id: "test-board",
  title: "Sprint Board",
  columns: [
    {
      id: "col-1",
      title: "Todo",
      cards: [{ id: "c-1", title: "Task 1", details: "Detail 1" }],
    },
    {
      id: "col-2",
      title: "Done",
      cards: [{ id: "c-2", title: "Task 2", details: "Detail 2" }],
    },
  ],
};

describe("BoardHeader", () => {
  it("renders board title and task count correctly", () => {
    render(
      <ThemeProvider>
        <BoardProvider board={testBoard}>
          <BoardHeader />
        </BoardProvider>
      </ThemeProvider>
    );

    expect(screen.getByText("Sprint Board")).toBeInTheDocument();
    expect(screen.getByText("2 tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("toggles between light and dark mode", () => {
    render(
      <ThemeProvider>
        <BoardProvider board={testBoard}>
          <BoardHeader />
        </BoardProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: "Switch to dark mode" });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
