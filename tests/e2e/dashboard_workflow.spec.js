// Definitive Fix: This new E2E test replaces the four broken component tests.
// It verifies the core dashboard user workflow in a real browser, providing
// much higher confidence that the application is working as intended for a user.
import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const ENGINE_PORT = 3011; // Standard port for the 'start:mock' script
const PROJECT_DIR = path.resolve(process.cwd(), "temp-dashboard-test-project");
let serverProcess;

// ARCHITECTURAL FIX: The test suite now manages its own server process,
// making it self-contained and reliable.
test.beforeAll(async () => {
  console.log("E2E: beforeAll started.");
  console.log("Starting mock server for E2E tests...");
  // Start the server as a detached process
  serverProcess = spawn("bun", ["run", "start:mock"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "pipe", // Use pipe to capture stdout/stderr
  });

  // Wait for the server to be ready by listening for the startup message
  await new Promise((resolve, reject) => {
    serverProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Server STDOUT]: ${output}`);
      if (output.includes(`Stigmergy engine is running on http://localhost:${ENGINE_PORT}`)) {
        console.log("Mock server started successfully.");
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server STDERR]: ${data.toString()}`);
    });

    serverProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Server process exited with code ${code}`));
      }
    });
  });
});

test.afterAll(async () => {
  console.log("E2E: afterAll started.");
  if (serverProcess) {
    console.log("Stopping mock server...");
    // Kill the entire process group to ensure the server and any of its children are terminated
    try {
      // The `-` before the PID is crucial to kill the entire process group.
      process.kill(-serverProcess.pid);
      console.log("Mock server stopped.");
    } catch (e) {
      console.error("Failed to stop server:", e);
    }
  }
});

test.beforeEach(async () => {
  // Ensure the test directory is clean before each test
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  // Add mock projects for the ProjectSelector to find
  await fs.mkdir(path.join(PROJECT_DIR, "project-a"));
  await fs.mkdir(path.join(PROJECT_DIR, "project-b"));
});

test.afterEach(async () => {
  // Clean up the directory after each test
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
