import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoardHeader } from "./BoardHeader";
import { BoardProvider } from "@/context/BoardContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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
        <AuthProvider>
          <BoardProvider board={testBoard}>
            <BoardHeader />
          </BoardProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    expect(screen.getByText("Sprint Board")).toBeInTheDocument();
    expect(screen.getByText("2 tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("toggles between light and dark mode", () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <BoardProvider board={testBoard}>
            <BoardHeader />
          </BoardProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: "Switch to dark mode" });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("links back to the project when a slug is given", () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <BoardProvider board={testBoard}>
            <BoardHeader projectSlug="MyProjects" projectTitle="My Projects" />
          </BoardProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    const link = screen.getByRole("link", { name: "My Projects" });
    expect(link).toHaveAttribute("href", "/projects/MyProjects");
  });

  it("links to the project list when no slug is given", () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <BoardProvider board={testBoard}>
            <BoardHeader />
          </BoardProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects"
    );
  });
});
