import { Board } from "@/types/kanban";

export const initialBoard: Board = {
  id: "board-1",
  title: "Project Alpha Roadmap",
  columns: [
    {
      id: "col-backlog",
      title: "Backlog",
      cards: [
        {
          id: "card-1",
          title: "Define system metrics",
          details: "Establish key performance indicators and alerting thresholds for core microservices.",
        },
        {
          id: "card-2",
          title: "User persona research",
          details: "Synthesize user interview recordings and update target segment profiles.",
        },
      ],
    },
    {
      id: "col-todo",
      title: "To Do",
      cards: [
        {
          id: "card-3",
          title: "Design authentication flow",
          details: "Map out login, password reset, and session management wireframes.",
        },
        {
          id: "card-4",
          title: "Configure database migrations",
          details: "Set up Alembic migration scripts and verify rollback procedures.",
        },
      ],
    },
    {
      id: "col-in-progress",
      title: "In Progress",
      cards: [
        {
          id: "card-5",
          title: "Develop Kanban UI",
          details: "Build responsive column layouts, card modals, and drag-and-drop interactions.",
        },
        {
          id: "card-6",
          title: "API schema definition",
          details: "Draft OpenAPI specification endpoints for board management and card updates.",
        },
      ],
    },
    {
      id: "col-in-review",
      title: "In Review",
      cards: [
        {
          id: "card-7",
          title: "Security compliance check",
          details: "Audit dependency vulnerabilities and ensure adherence to security standards.",
        },
      ],
    },
    {
      id: "col-done",
      title: "Done",
      cards: [
        {
          id: "card-8",
          title: "Project kickoff meeting",
          details: "Aligned scope, timeline, and deliverables with executive stakeholders.",
        },
        {
          id: "card-9",
          title: "Setup repository structure",
          details: "Initialize Next.js frontend and establish testing conventions.",
        },
      ],
    },
  ],
};
