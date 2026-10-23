import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateRegistration,
} from "./accountValidation";

describe("validateName", () => {
  it("requires a non-blank name", () => {
    expect(validateName("   ")).toBe("Name is required");
  });

  it("rejects names longer than 100 characters", () => {
    expect(validateName("x".repeat(101))).toMatch(/100 characters/);
    expect(validateName("x".repeat(100))).toBeNull();
  });
});

describe("validateEmail", () => {
  it.each(["ada@example.com", "first.last@mail.example.org"])("accepts %s", (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it.each(["not-an-email", "a@b", "two@@example.com", "spaces in@example.com"])("rejects %s", (email) => {
    expect(validateEmail(email)).toBe("Enter a valid email address");
  });
});

describe("validatePassword", () => {
  it("requires at least 8 characters", () => {
    expect(validatePassword("1234567")).toMatch(/at least 8/);
    expect(validatePassword("12345678")).toBeNull();
  });
});

describe("validateRegistration", () => {
  const valid = {
    name: "Ada",
    email: "ada@example.com",
    password: "analytical1",
    confirmPassword: "analytical1",
  };

  it("returns no errors for valid input", () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it("reports mismatched passwords", () => {
    expect(validateRegistration({ ...valid, confirmPassword: "different1" })).toEqual({
      confirmPassword: "Passwords do not match",
    });
  });

  it("reports every invalid field at once", () => {
    const errors = validateRegistration({ name: "", email: "bad", password: "short", confirmPassword: "" });
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "password"]);
  });
});
