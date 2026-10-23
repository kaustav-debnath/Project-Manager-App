import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

test.describe("Accounts", () => {
  test("register, edit profile, change password, then sign in again", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("first-password");
    await page.getByLabel("Confirm password").fill("first-password");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("My Projects").first()).toBeVisible();

    await page.getByRole("button", { name: "Account menu for E2E Tester" }).click();
    await page.getByRole("menuitem", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByLabel("Name").fill("E2E Renamed");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible();
    await expect(page.getByRole("button", { name: "Account menu for E2E Renamed" })).toBeVisible();

    await page.getByLabel("Current password").fill("first-password");
    await page.getByLabel("New password", { exact: true }).fill("second-password");
    await page.getByLabel("Confirm new password").fill("second-password");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText(/Password changed/)).toBeVisible();

    await page.getByRole("button", { name: "Account menu for E2E Renamed" }).click();
    await page.getByRole("menuitem", { name: "Log Out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByPlaceholder("you@example.com").fill(email);
    await page.locator("input[name=password]").fill("second-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("registering with an email that already exists shows an error", async ({ page, request }) => {
    const email = uniqueEmail();
    const created = await request.post("/api/register", {
      data: { name: "First Owner", email, password: "first-password" },
    });
    expect(created.status()).toBe(201);

    await page.goto("/register");
    await page.getByLabel("Name").fill("Second Owner");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("another-password");
    await page.getByLabel("Confirm password").fill("another-password");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("An account with this email already exists")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});
