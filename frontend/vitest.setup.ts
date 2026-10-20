import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

// Mock global fetch to prevent actual network calls during tests.
beforeEach(() => {
  // Store the test-specific board data that tests expect
  const testBoardData = {
    id: 1,
    title: "Project Alpha Roadmap", // default title for mocked responses
    columns: [
      {
        id: 1,
        title: "Backlog",
        position: 0,
        cards: [
          { id: 1, title: "Define system metrics", details: "" },
          { id: 2, title: "User persona research", details: "" },
        ],
      },
      {
        id: 2,
        title: "To Do",
        position: 1,
        cards: [
          { id: 3, title: "Design authentication flow", details: "" },
          { id: 4, title: "Configure database migrations", details: "" },
        ],
      },
      {
        id: 3,
        title: "In Progress",
        position: 2,
        cards: [
          { id: 5, title: "Develop Kanban UI", details: "" },
          { id: 6, title: "API schema definition", details: "" },
        ],
      },
      {
        id: 4,
        title: "In Review",
        position: 3,
        cards: [
          { id: 7, title: "Security compliance check", details: "" },
        ],
      },
      {
        id: 5,
        title: "Done",
        position: 4,
        cards: [
          { id: 8, title: "Project kickoff meeting", details: "" },
          { id: 9, title: "Setup repository structure", details: "" },
        ],
      },
    ],
  };

  globalThis.fetch = vi.fn(async (url: string, init: RequestInit = {}) => {
    // Handle different API endpoints
    if (url === "/api/board" || url.endsWith("/api/board")) {
      return new Response(
        JSON.stringify({ board: testBoardData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url === "/api/auth/status" || url.endsWith("/api/auth/status")) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.startsWith("/api/board/card") && init.method === "POST") {
      // Simulate adding a new card - return the new card with an ID
      const newCardId = 100; // Simulated new ID
      return new Response(
        JSON.stringify({ success: true, cardId: newCardId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.startsWith("/api/board/card") && init.method === "PUT") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.startsWith("/api/board/card") && init.method === "DELETE") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.startsWith("/api/board/column") && init.method === "PUT") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.startsWith("/api/board/card") && url.endsWith("/move") && init.method === "PATCH") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    // Default fallback
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});