import { mock, describe, test, expect, beforeEach } from 'bun:test';

process.env.OPENROUTER_API_KEY = "test_key";

// Mock dependencies using the ESM-compatible API
mock.module("ai", () => ({
  generateObject: mock()
}));
mock.module("../../ai/providers.js", () => ({
  getModelForTier: mock()
}));
mock.module('fs-extra', () => {
  const memfs = require('memfs'); // Use require here for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: mock(),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        pathExists: mock(),
        readFile: mock(),
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    }
  };
});
mock.module("glob", () => ({
  glob: mock(),
}));

describe("Milestone Verification", () => {
  let verifyMilestone, getModelForTier, generateObject, fs, glob;

  beforeEach(async () => {
    // Dynamically import modules to get mocked versions
    verifyMilestone = (await import("../../engine/verification_system.js")).verifyMilestone;
    getModelForTier = (await import("../../ai/providers.js")).getModelForTier;
    generateObject = (await import("ai")).generateObject;
    fs = (await import("fs-extra")).default;
    glob = (await import("glob")).glob;

    // Reset mocks
    mock.restore();

    // Setup mock implementations
    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockImplementation(async (filePath) => {
        if (String(filePath).endsWith('prd.md')) return "PRD content mentioning user_authentication and dashboard.";
        if (String(filePath).endsWith('architecture.md')) return "Architecture content mentioning LoginComponent and DashboardComponent.";
        if (String(filePath).endsWith('LoginComponent.js')) return "class LoginComponent {}";
        if (String(filePath).endsWith('DashboardComponent.js')) return "class DashboardComponent {}";
        return "";
    });
    glob.mockResolvedValue(['src/components/LoginComponent.js', 'src/components/DashboardComponent.js']);
  });

  test("should verify milestone successfully", async () => {
    generateObject
      .mockResolvedValueOnce({ object: { terms: ["LoginComponent", "DashboardComponent"] } })
      .mockResolvedValueOnce({ object: { terms: ["LoginComponent"] } });

    const result = await verifyMilestone("Test milestone");
    expect(result.success).toBe(true);
  });
});
