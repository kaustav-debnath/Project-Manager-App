import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegisterForm } from "./RegisterForm";
import { ThemeProvider } from "@/context/ThemeContext";

const mockAuth = vi.hoisted(() => ({
  user: null as null | { id: number; name: string; email: string },
  isLoading: false,
  register: vi.fn(async (_name: string, _email: string, _password: string) => null as string | null),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

function fillForm(values: { name?: string; email?: string; password?: string; confirm?: string }) {
  if (values.name !== undefined) fireEvent.change(screen.getByLabelText("Name"), { target: { value: values.name } });
  if (values.email !== undefined) fireEvent.change(screen.getByLabelText("Email"), { target: { value: values.email } });
  if (values.password !== undefined) fireEvent.change(screen.getByLabelText("Password"), { target: { value: values.password } });
  if (values.confirm !== undefined) fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: values.confirm } });
}

function renderForm() {
  return render(
    <ThemeProvider>
      <RegisterForm />
    </ThemeProvider>
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.isLoading = false;
    mockAuth.register.mockReset();
    mockAuth.register.mockResolvedValue(null);
  });

  it("shows validation errors and does not submit an invalid form", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it("flags mismatched passwords", async () => {
    renderForm();
    fillForm({ name: "Ada", email: "ada@example.com", password: "analytical1", confirm: "different1" });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it("shows the server error when registration fails", async () => {
    mockAuth.register.mockResolvedValue("An account with this email already exists");
    renderForm();
    fillForm({ name: "Ada", email: "ada@example.com", password: "analytical1", confirm: "analytical1" });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("An account with this email already exists");
    expect(mockAuth.register).toHaveBeenCalledWith("Ada", "ada@example.com", "analytical1");
  });

  it("links to the sign-in page", () => {
    renderForm();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
