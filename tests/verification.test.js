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

test("should verify milestone successfully", async () => {
  // Mock the AI responses
  generateObject.mockResolvedValueOnce({
    object: {
      terms: ["LoginComponent", "DashboardComponent"],
    },
  });
  generateObject.mockResolvedValueOnce({
    object: {
      goals: ["user_authentication", "dashboard"], // Fixed to match the code
    },
  });

  const result = await verifyMilestone("Test milestone");
  expect(result.success).toBe(true);
});
