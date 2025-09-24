import { mock, jest, describe, test, expect, beforeEach } from 'bun:test';

mock.module("../../../ai/providers.js", () => ({
    getModelForTier: jest.fn(),
}));
mock.module("ai", () => ({
  generateObject: jest.fn(),
}));

const { getModelForTier } = await import("../../../ai/providers.js");
const { generateObject } = await import("ai");
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
      const mockExecPromise = jest.fn().mockResolvedValue({ stdout });
      const result = await run_tests_and_check_coverage({ required_coverage: 90, execPromise: mockExecPromise });
      expect(result.passed).toBe(true);
      expect(result.feedback).toContain("95.5%");
    });

    test("should return failed if coverage is insufficient", async () => {
        const stdout = "All files | 75.0 | ...";
        const mockExecPromise = jest.fn().mockResolvedValue({ stdout });
        const result = await run_tests_and_check_coverage({ required_coverage: 90, execPromise: mockExecPromise });
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("75%");
      });

      test("should handle test execution failure", async () => {
        const mockExecPromise = jest.fn().mockRejectedValue(new Error("Tests failed"));
        const result = await run_tests_and_check_coverage({ execPromise: mockExecPromise });
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("Test execution failed: Tests failed");
      });

      test("should handle no coverage match in stdout", async () => {
        const stdout = "No coverage found";
        const mockExecPromise = jest.fn().mockResolvedValue({ stdout });
        const result = await run_tests_and_check_coverage({ execPromise: mockExecPromise });
        expect(result.passed).toBe(false);
        expect(result.feedback).toContain("Coverage of 0% is below");
      });
  });
});
