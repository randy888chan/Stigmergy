// Definitive Fix: This new E2E test replaces the four broken component tests.
// It verifies the core dashboard user workflow in a real browser, providing
// much higher confidence that the application is working as intended for a user.
import { test, expect } from "@playwright/test";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const ENGINE_PORT = 3014; // Use a unique port for this test
const PROJECT_DIR = path.resolve(process.cwd(), "temp-dashboard-test-project");
let engineProcess;

test.beforeAll(async () => {
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
  await fs.mkdir(PROJECT_DIR, { recursive: true });

  // Use the reliable 'start:mock' script to run the server in a controlled environment.
  engineProcess = spawn("bun", ["run", "start:mock"], {
    env: {
      ...process.env,
      PORT: ENGINE_PORT.toString(),
      STIGMERGY_PORT: ENGINE_PORT.toString(),
      OPENROUTER_API_KEY: "mock-api-key",
      OPENROUTER_BASE_URL: `http://localhost:${ENGINE_PORT}`,
      PROJECTS_BASE_PATH: PROJECT_DIR, // Ensure the mock server knows where to find projects
    },
    detached: true,
  });

  // Add mock projects for the ProjectSelector to find
  await fs.mkdir(path.join(PROJECT_DIR, "project-a"));
  await fs.mkdir(path.join(PROJECT_DIR, "project-b"));

  // Log server output for easier debugging
  engineProcess.stdout.on("data", (data) => console.log(`[Dashboard E2E STDOUT]: ${data}`));
  engineProcess.stderr.on("data", (data) => console.error(`[Dashboard E2E STDERR]: ${data}`));

  // Wait for the engine to be ready by polling the health endpoint
  await new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:${ENGINE_PORT}/health`);
        if (response.ok) {
          console.log("[Dashboard E2E] Server is healthy.");
          clearInterval(interval);
          resolve();
        }
      } catch (e) {
        // Ignore fetch errors while waiting for server
      }
    }, 1000);
  });
});

test.afterAll(async () => {
  if (engineProcess) {
    process.kill(-engineProcess.pid); // Kill the process group
  }
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
});

test.describe("Dashboard Core Workflow", () => {
  test("should allow a user to select a project and start a mission", async ({ page }) => {
    // 1. Navigate to the dashboard
    await page.goto(`http://localhost:${ENGINE_PORT}`);

    // 2. Verify the initial state
    await expect(page.locator("h1")).toContainText("Stigmergy");
    await expect(page.getByPlaceholder("Set a project first...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();

    // 3. Select a project
    await page.getByRole("button", { name: "Find Projects" }).click();
    await page.getByRole("combobox").click();
    await page.getByText("project-a").click();

    // 4. Verify state after project selection
    await expect(page.getByPlaceholder("Enter your mission objective...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();

    // 5. Submit a mission
    await page.fill(
      'textarea[placeholder="Enter your mission objective..."]',
      "Create a simple hello world script."
    );
    await page.getByRole("button", { name: "Send" }).click();

    // 6. Verify mission submission by checking for an updated UI element
    // The ActivityLog should show that the mission briefing was processed.
    await expect(
      page.locator("div").filter({ hasText: /^Mission Briefing Processed$/ })
    ).toBeVisible({ timeout: 20000 });
  });
});
