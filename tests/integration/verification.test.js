import { jest, describe, test, expect, beforeEach } from '@jest/globals';

process.env.OPENROUTER_API_KEY = "test_key";

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule("ai", () => ({
  generateObject: jest.fn()
}));
jest.unstable_mockModule("../../ai/providers.js", () => ({
  getModelForTier: jest.fn()
}));
jest.unstable_mockModule("fs-extra", () => ({
  default: {
    pathExists: jest.fn(),
    readFile: jest.fn(),
  },
}));
jest.unstable_mockModule("glob", () => ({
  glob: jest.fn(),
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
    jest.clearAllMocks();

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
