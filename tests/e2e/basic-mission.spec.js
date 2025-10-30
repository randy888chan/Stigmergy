import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const ENGINE_PORT = 3011; // Standard port for the 'start:mock' script
const PROJECT_DIR = path.resolve(process.cwd(), "temp-playwright-project");
const OUTPUT_FILE = path.join(PROJECT_DIR, "output.js");

// Note: The server is now expected to be started externally before running the tests.

test.beforeEach(async () => {
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
  await fs.mkdir(PROJECT_DIR, { recursive: true });
});

test.afterEach(async () => {
  await fs.rm(PROJECT_DIR, { recursive: true, force: true });
});

test("should create a file based on a simple mission goal", async ({ request }) => {
  const goal = "Create a file named output.js that logs 'Hello from Playwright'";

  // --- DEFINITIVE FIX: Use the correct '/mcp' GET endpoint with query parameters ---
  const params = new URLSearchParams({
    goal: goal,
    project_path: PROJECT_DIR,
  });
  const response = await request.get(`http://localhost:${ENGINE_PORT}/mcp?${params.toString()}`);

  // The /mcp endpoint returns a stream. We just need to check the initial response is ok.
  expect(response.ok()).toBeTruthy();

  // Poll for the file to be created
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
        timeout: 60000, // 60 seconds
      }
    )
    .toBe(true);

  // Verify the file content
  const fileContent = await fs.readFile(OUTPUT_FILE, "utf-8");
  expect(fileContent.trim()).toContain("console.log('Hello from Playwright')");
});
