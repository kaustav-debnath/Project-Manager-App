import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserMenu, initialsFor } from "./UserMenu";

const mockAuth = vi.hoisted(() => ({
  user: null as null | { id: number; name: string; email: string },
  logout: vi.fn(async () => {}),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

describe("initialsFor", () => {
  it("uses the first and last name initials", () => {
    expect(initialsFor("Ada King Lovelace")).toBe("AL");
    expect(initialsFor("grace")).toBe("G");
    expect(initialsFor("   ")).toBe("?");
  });
});

describe("UserMenu", () => {
  beforeEach(() => {
    mockAuth.user = { id: 1, name: "Ada Lovelace", email: "ada@example.com" };
    mockAuth.logout.mockClear();
  });

  it("renders nothing when no one is signed in", () => {
    mockAuth.user = null;
    const { container } = render(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows initials on the avatar and opens a menu with Profile and Log Out", () => {
    render(<UserMenu />);
    const avatar = screen.getByRole("button", { name: "Account menu for Ada Lovelace" });
    expect(avatar).toHaveTextContent("AL");
    expect(avatar).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(avatar);

    expect(avatar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: "Log Out" })).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside the menu", () => {
    render(
      <div>
        <p>outside</p>
        <UserMenu />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    fireEvent.mouseDown(screen.getByText("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("calls logout from the Log Out item", async () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Log Out" }));
    expect(mockAuth.logout).toHaveBeenCalledTimes(1);
  });
});
