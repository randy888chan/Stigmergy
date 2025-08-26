process.env.OPENROUTER_API_KEY = "test_key";
import { verifyMilestone } from "../engine/verification_system.js";
import { getModelForTier } from "../ai/providers.js";
import { generateObject } from "ai";
import fs from "fs-extra";
import { glob } from "glob";

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("../ai/providers.js", () => ({ getModelForTier: jest.fn() }));
jest.mock("fs-extra");
jest.mock("glob");

describe("Milestone Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockImplementation(async (filePath) => {
        if (filePath.endsWith('prd.md')) return "PRD content mentioning user_authentication and dashboard.";
        if (filePath.endsWith('architecture.md')) return "Architecture content mentioning LoginComponent and DashboardComponent.";
        if (filePath.endsWith('LoginComponent.js')) return "class LoginComponent {}";
        if (filePath.endsWith('DashboardComponent.js')) return "class DashboardComponent {}";
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
