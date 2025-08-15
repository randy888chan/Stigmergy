import { jest } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
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

  afterAll(async () => {
    await fs.emptyDir(distDir);
    // Clean up the global config
    delete global.StigmergyConfig;
  });

  beforeEach(async () => {
    await fs.emptyDir(distDir);
  });

  test("successful build creates agent team bundles", async () => {
    await build();
    // Check for one of the expected output files
    const expectedFile = path.join(distDir, "team-all.txt");
    expect(fs.existsSync(expectedFile)).toBe(true);
  });
});
