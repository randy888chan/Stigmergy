import { verifyMilestone } from "../engine/verification_system.js";
import { getModel } from "../ai/providers.js";
import { generateObject } from "ai";

// Mock the AI functions to avoid actual API calls
jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));
jest.mock("../ai/providers.js", () => ({
  getModel: jest.fn(),
}));

import fs from "fs-extra";
import path from "path";

describe("Milestone Verification", () => {
  const srcDir = path.join(process.cwd(), "src");
  const docsDir = path.join(process.cwd(), "docs");

  beforeAll(async () => {
    // Create dummy src and docs directories and files
    await fs.ensureDir(path.join(srcDir, "components"));
    await fs.writeFile(
      path.join(srcDir, "components", "LoginComponent.js"),
      "// user_authentication"
    );
    await fs.writeFile(path.join(srcDir, "components", "DashboardComponent.js"), "// dashboard");

    await fs.ensureDir(docsDir);
    await fs.writeFile(path.join(docsDir, "prd.md"), "Product Requirements Document");
    await fs.writeFile(path.join(docsDir, "architecture.md"), "Architecture Document");
  });

  afterAll(async () => {
    // Clean up dummy files
    await fs.remove(srcDir);
    await fs.remove(docsDir);
  });

  test("should verify milestone successfully", async () => {
    // Mock the AI responses
    generateObject.mockResolvedValueOnce({
      object: {
        terms: ["LoginComponent", "DashboardComponent"],
      },
    });
    generateObject.mockResolvedValueOnce({
      object: {
        terms: ["user_authentication", "dashboard"],
      },
    });

    const result = await verifyMilestone("Test milestone");
    expect(result.success).toBe(true);
    expect(result.details.architectural_compliance.verified).toBe(true);
    expect(result.details.functional_compliance.verified).toBe(true);
  });
});
