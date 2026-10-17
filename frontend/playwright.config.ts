import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    // Start backend (FastAPI) for API routes
    {
      command: process.platform === "win32"
        ? "cd ..\\backend && uv run uvicorn main:app --port 8001"
        : "cd " + join(__dirname, "..", "backend") + " && uv run uvicorn main:app --port 8001",
      url: "http://127.0.0.1:8001/api/hello",
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
    // Start frontend (Next.js dev with API proxy to backend)
    {
      command: "npm run dev",
      url: "http://127.0.0.1:3000",
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
