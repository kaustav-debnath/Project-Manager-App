import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("links each parent and separates them", () => {
    render(<Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: "My Projects", href: "/projects/MyProjects" }]} />);

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "My Projects" })).toHaveAttribute("href", "/projects/MyProjects");
    expect(screen.getAllByText("/")).toHaveLength(1);
  });

  it("renders an item without a href as plain text", () => {
    render(<Breadcrumbs items={[{ label: "Projects" }]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });
});
