import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const ENGINE_PORT = 3011;
const PROJECT_DIR = path.resolve(process.cwd(), "temp-playwright-project");
const OUTPUT_FILE = path.join(PROJECT_DIR, "output.js");

let serverProcess;

test.beforeAll(async () => {
  // Start the server as a background process
  serverProcess = spawn("bun", ["run", "start:mock"], {
    stdio: "inherit",
    detached: true,
  });

  // Wait for the server to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));
});

test.afterAll(async () => {
  // Kill the server process
  if (serverProcess) {
    process.kill(-serverProcess.pid);
  }
});

test.beforeEach(async () => {
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
  await fs.mkdir(PROJECT_DIR, { recursive: true });
});

test.afterEach(async () => {
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
});

test("should create a file based on a simple mission goal", async ({ request }) => {
  const goal = "Create a file named output.js that logs 'Hello from Playwright'";

  const params = new URLSearchParams({
    goal: goal,
    project_path: PROJECT_DIR,
  });
  const response = await request.get(`http://localhost:${ENGINE_PORT}/mcp?${params.toString()}`);

  expect(response.ok()).toBeTruthy();

  await expect
    .poll(
      async () => {
        try {
          await fs.access(OUTPUT_FILE);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "Output file was not created within the timeout.",
        timeout: 60000,
      }
    )
    .toBe(true);

  const fileContent = await fs.readFile(OUTPUT_FILE, "utf-8");
  expect(fileContent.trim()).toContain("console.log('Hello from Playwright')");
});
