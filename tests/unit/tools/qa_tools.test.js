import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule("../../../ai/providers.js", () => ({
    getModelForTier: jest.fn(),
}));
jest.unstable_mockModule("ai", () => ({
  generateObject: jest.fn(),
}));
jest.unstable_mockModule("child_process", () => ({
  exec: jest.fn(),
}));

const { getModelForTier } = await import("../../../ai/providers.js");
const { generateObject } = await import("ai");
const { exec } = await import("child_process");
const {
  verify_requirements,
  verify_architecture,
  run_tests_and_check_coverage,
} = await import("../../../tools/qa_tools.js");

describe("QA Tools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("verify_requirements", () => {
    test("should call generateObject and return its result", async () => {
      const mockResponse = { passed: true, feedback: "All good" };
      generateObject.mockResolvedValue({ object: mockResponse });

      const result = await verify_requirements({ requirements: "reqs", code: "code" });

      expect(getModelForTier).toHaveBeenCalledWith("b_tier");
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe("verify_architecture", () => {
    test("should call generateObject and return its result", async () => {
      const mockResponse = { passed: true, feedback: "Looks like the blueprint" };
      generateObject.mockResolvedValue({ object: mockResponse });

      const result = await verify_architecture({ architecture_blueprint: "arc", code: "code" });

      expect(getModelForTier).toHaveBeenCalledWith("b_tier");
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe("run_tests_and_check_coverage", () => {
    test("should return passed if coverage is sufficient", async () => {
      const stdout = "All files | 95.5 | ...";
      exec.mockImplementation((command, callback) => callback(null, { stdout }));
      const result = await run_tests_and_check_coverage({ required_coverage: 90 });
      expect(result.passed).toBe(true);
      expect(result.feedback).toContain("95.5%");
    });

    test("should return failed if coverage is insufficient", async () => {
        const stdout = "All files | 75.0 | ...";
        exec.mockImplementation((command, callback) => callback(null, { stdout }));
        const result = await run_tests_and_check_coverage({ required_coverage: 90 });
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("75%");
      });

      test("should handle test execution failure", async () => {
        exec.mockImplementation((command, callback) => callback(new Error("Tests failed"), null));
        const result = await run_tests_and_check_coverage({});
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("Test execution failed: Tests failed");
      });

      test("should handle no coverage match in stdout", async () => {
        const stdout = "No coverage found";
        exec.mockImplementation((command, callback) => callback(null, { stdout }));
        const result = await run_tests_and_check_coverage({});
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("Coverage of 0% is below");
      });
  });
});
