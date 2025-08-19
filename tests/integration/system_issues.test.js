import { jest } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import build from "../../cli/commands/build.js";

// Mock console to prevent logs from cluttering test output
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("System Issues Test", () => {
  const distDir = path.join(process.cwd(), "dist");
  const testCoreDir = path.join(process.cwd(), "tests", "fixtures", "test-core");

  beforeAll(() => {
    // Point the build script to the test-specific core directory created by `pretest`
    global.StigmergyConfig = { core_path: testCoreDir };
  });

  // afterAll(async () => {
  //   await fs.emptyDir(distDir);
  //   // Clean up the global config
  //   delete global.StigmergyConfig;
  // });

  // beforeEach(async () => {
  //   await fs.emptyDir(distDir);
  // });

  test.skip("successful build creates agent team bundles", async () => {
    let createdFiles = [];
    try {
        createdFiles = await build();
    } catch (error) {
        console.error("Error during build:", error);
    }
    const expectedFile = path.join(distDir, "team-all.txt");
    expect(createdFiles).toContain(expectedFile);
  });
});
