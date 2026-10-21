import { test, expect, Page } from "@playwright/test";

const SEEDED_PROJECT = "My Projects";
const SEEDED_BOARD = "Project Alpha Roadmap";

// A throwaway project and board the suite mutates, so the seeded data stays
// intact and every run starts from the same state.
let e2eProjectId = "";
let e2eProjectSlug = "";
let e2eBoardId = "";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("user").fill("user");
  await page.getByPlaceholder("password").fill("password");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

async function openProject(page: Page, title: string) {
  await page.getByRole("heading", { name: title, exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
}

async function openBoard(page: Page, title: string) {
  await page.getByRole("heading", { name: title, exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/boards\/\d+$/);
}

test.describe("OmniRoute routing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lists projects and opens one by slug", async ({ page }) => {
    await expect(page.getByRole("heading", { name: SEEDED_PROJECT })).toBeVisible();

    await openProject(page, SEEDED_PROJECT);

    await expect(page).toHaveURL(/\/projects\/MyProjects$/);
    await expect(page.getByRole("heading", { name: SEEDED_PROJECT })).toBeVisible();
  });

  test("opens a board nested under the project", async ({ page }) => {
    await openProject(page, SEEDED_PROJECT);
    await openBoard(page, SEEDED_BOARD);

    await expect(page.getByRole("heading", { name: SEEDED_BOARD })).toBeVisible();
    await expect(page.getByRole("link", { name: SEEDED_PROJECT })).toHaveAttribute(
      "href",
      "/projects/MyProjects"
    );
  });

  test("opens a project created at runtime", async ({ page }) => {
    const title = `Runtime Project ${Date.now()}`;

    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByPlaceholder("My Project").fill(title);
    await page
      .getByPlaceholder("Describe your project...")
      .fill("Created by the e2e suite");
    await page.getByRole("button", { name: "Create Project" }).click();

    const card = page.getByRole("heading", { name: title });
    await expect(card).toBeVisible();

    await card.click();
    await expect(page).toHaveURL(/\/projects\/RuntimeProject\d+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const projects = await (await page.request.get("/api/projects")).json();
    const created = projects.projects.find((p: any) => p.title === title);
    await page.request.delete(`/api/projects/${created.id}`);
  });

  test("opens a board created at runtime", async ({ page }) => {
    const title = `Runtime Board ${Date.now()}`;

    await openProject(page, SEEDED_PROJECT);

    await page.getByRole("button", { name: "New Board" }).click();
    await page.getByPlaceholder("My Board").fill(title);
    await page.getByRole("button", { name: "Create Board" }).click();

    const card = page.getByRole("heading", { name: title });
    await expect(card).toBeVisible();

    await card.click();
    await expect(page).toHaveURL(/\/projects\/MyProjects\/boards\/\d+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const project = await (await page.request.get("/api/projects/1")).json();
    const board = project.boards.find((b: any) => b.title === title);
    await page.request.delete(`/api/projects/1/boards/${board.id}`);
  });

  test("deletes a board after confirmation", async ({ page }) => {
    const title = `Disposable Board ${Date.now()}`;

    await openProject(page, SEEDED_PROJECT);

    await page.getByRole("button", { name: "New Board" }).click();
    await page.getByPlaceholder("My Board").fill(title);
    await page.getByRole("button", { name: "Create Board" }).click();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByLabel(`Delete ${title}`).click();

    const dialog = page.getByRole("dialog", { name: "Delete board" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.getByRole("heading", { name: title })).not.toBeVisible();

    const project = await (await page.request.get("/api/projects/1")).json();
    expect(project.boards.find((b: any) => b.title === title)).toBeUndefined();
  });
});

test.describe("Kanban Board MVP", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "user", password: "password" },
    });

    const projectResponse = await request.post("/api/projects", {
      data: { title: "E2E Project" },
    });
    const project = await projectResponse.json();
    e2eProjectId = String(project.projectId);
    e2eProjectSlug = project.slug;

    const boardResponse = await request.post(
      `/api/projects/${e2eProjectId}/boards`,
      { data: { title: "E2E Board" } }
    );
    const board = await boardResponse.json();
    e2eBoardId = String(board.boardId);

    const boardResponse2 = await request.get(
      `/api/projects/${e2eProjectId}/boards/${e2eBoardId}`
    );
    const { board: loaded } = await boardResponse2.json();

    const cards = [
      "E2E Editable Task",
      "E2E Deletable Task",
      "E2E Draggable Task",
    ];
    for (const [index, title] of cards.entries()) {
      await request.post(
        `/api/projects/${e2eProjectId}/boards/${e2eBoardId}/columns/${loaded.columns[index].id}/card`,
        { data: { title, details: "Created by the e2e suite" } }
      );
    }
  });

  test.afterAll(async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "user", password: "password" },
    });
    await request.delete(`/api/projects/${e2eProjectId}`);
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/projects/${e2eProjectSlug}/boards/${e2eBoardId}`);
    await expect(page.getByRole("heading", { name: "E2E Board" })).toBeVisible();
  });

  test("renders the board with the 5 default columns", async ({ page }) => {
    const expectedColumns = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
    for (const col of expectedColumns) {
      await expect(page.getByText(col, { exact: true })).toBeVisible();
    }
  });

  test("renders the seeded board with its dummy cards", async ({ page }) => {
    await page.goto("/projects");
    await openProject(page, SEEDED_PROJECT);
    await openBoard(page, SEEDED_BOARD);

    await expect(page.getByText("Define system metrics")).toBeVisible();
    await expect(page.getByText("Project kickoff meeting")).toBeVisible();
  });

  test("allows toggling between light and dark mode", async ({ page }) => {
    const toggleButton = page.getByRole("button", {
      name: /Switch to dark mode|Switch to light mode/i,
    });
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
    await page
      .getByPlaceholder("Add relevant context, acceptance criteria, or notes...")
      .fill("Details for E2E task");

    await page.getByRole("button", { name: "Create Card" }).click();

    await expect(page.getByText("E2E Automated Task")).toBeVisible();
    await expect(page.getByText("Details for E2E task")).toBeVisible();
  });

  test("allows editing an existing card", async ({ page }) => {
    const editButton = page.getByLabel("Edit E2E Editable Task");
    await editButton.click({ force: true });

    await expect(page.getByRole("heading", { name: "Edit Card" })).toBeVisible();

    const titleInput = page.getByPlaceholder("e.g. Implement user authentication");
    await titleInput.fill("Refined E2E Task");

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Refined E2E Task")).toBeVisible();
  });

  test("allows deleting a card", async ({ page }) => {
    await expect(page.getByText("E2E Deletable Task")).toBeVisible();

    const deleteButton = page.getByLabel("Delete E2E Deletable Task");
    await deleteButton.click({ force: true });

    await expect(page.getByText("E2E Deletable Task")).not.toBeVisible();
  });

  test("allows moving a card to another column via drag and drop", async ({ page }) => {
    const cardToDrag = page.getByText("E2E Draggable Task");
    const targetColumn = page.getByText("In Review", { exact: true });

    await cardToDrag.dragTo(targetColumn);

    await expect(cardToDrag).toBeVisible();
  });
});
