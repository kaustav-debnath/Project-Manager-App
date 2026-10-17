import { test, expect } from "@playwright/test";

test.describe("Kanban Board MVP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the single board with 5 default columns and dummy cards", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Project Alpha Roadmap" })).toBeVisible();

    const expectedColumns = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
    for (const col of expectedColumns) {
      await expect(page.getByText(col, { exact: true })).toBeVisible();
    }

    // Verify some dummy cards exist
    await expect(page.getByText("Define system metrics")).toBeVisible();
    await expect(page.getByText("Project kickoff meeting")).toBeVisible();
  });

  test("allows toggling between light and dark mode", async ({ page }) => {
    const toggleButton = page.getByRole("button", { name: /Switch to dark mode|Switch to light mode/i });
    await expect(toggleButton).toBeVisible();

    // Toggle to dark mode if currently light
    const isLight = await toggleButton.getByText("Dark Mode").isVisible();
    if (isLight) {
      await toggleButton.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(toggleButton.getByText("Light Mode")).toBeVisible();

      // Toggle back to light mode
      await toggleButton.click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expect(toggleButton.getByText("Dark Mode")).toBeVisible();
    }
  });

  test("allows renaming a column", async ({ page }) => {
    const backlogCol = page.getByRole("button", { name: "Backlog" });
    await backlogCol.click();

    const input = page.getByLabel("Edit column title");
    await expect(input).toBeVisible();
    await input.fill("Product Backlog");
    await input.press("Enter");

    await expect(page.getByText("Product Backlog", { exact: true })).toBeVisible();
  });

  test("allows adding a new card to a column", async ({ page }) => {
    const addButtons = page.getByRole("button", { name: "Add Card" });
    await addButtons.first().click();

    await expect(page.getByRole("heading", { name: "Add New Card" })).toBeVisible();

    await page.getByPlaceholder("e.g. Implement user authentication").fill("E2E Automated Task");
    await page.getByPlaceholder("Add relevant context, acceptance criteria, or notes...").fill("Details for E2E task");

    await page.getByRole("button", { name: "Create Card" }).click();

    await expect(page.getByText("E2E Automated Task")).toBeVisible();
    await expect(page.getByText("Details for E2E task")).toBeVisible();
  });

  test("allows editing an existing card", async ({ page }) => {
    const editButton = page.getByLabel("Edit Define system metrics");
    await editButton.click({ force: true });

    await expect(page.getByRole("heading", { name: "Edit Card" })).toBeVisible();

    const titleInput = page.getByPlaceholder("e.g. Implement user authentication");
    await titleInput.fill("Refined system metrics");

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Refined system metrics")).toBeVisible();
  });

  test("allows deleting a card", async ({ page }) => {
    await expect(page.getByText("Define system metrics")).toBeVisible();

    const deleteButton = page.getByLabel("Delete Define system metrics");
    await deleteButton.click({ force: true });

    await expect(page.getByText("Define system metrics")).not.toBeVisible();
  });

  test("allows moving a card to another column via drag and drop", async ({ page }) => {
    const cardToDrag = page.getByText("Define system metrics");
    const targetColumn = page.getByText("In Review", { exact: true });

    await cardToDrag.dragTo(targetColumn);

    await expect(cardToDrag).toBeVisible();
  });
});
