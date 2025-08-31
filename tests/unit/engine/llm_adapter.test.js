import fs from "fs-extra";
import path from "path";
import { getCompletion, getSystemPrompt, clearFileCache, decomposeGoal } from "../../../engine/llm_adapter.js";
import { getModelForTier } from "../../../ai/providers.js";
import yaml from 'js-yaml';

// Mock dependencies
jest.mock("fs-extra");
jest.mock("../../../ai/providers.js");

describe("LLM Adapter", () => {
  let mockLlm;

  beforeAll(() => {
    // Suppress console output during these tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup a mock LLM that can be returned by the provider
    mockLlm = {
      generate: jest.fn(),
    };
    getModelForTier.mockReturnValue(mockLlm);

    // Mock fs.readFile for agent definitions
    fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('test-agent.md')) {
            const mockAgentContent = { agent: { model_tier: 'a_tier' } };
            const yamlString = yaml.dump(mockAgentContent);
            return Promise.resolve("```yaml\n" + yamlString + "\n```");
        }
        return Promise.reject(new Error("File not found"));
    });
  });

  describe("getCompletion", () => {
    test("should call the LLM with the correct agent-specific model tier", async () => {
      mockLlm.generate.mockResolvedValue({ text: '{"thought": "test", "action": "test"}' });

      await getCompletion("test-agent", "What is the plan?");

      expect(getModelForTier).toHaveBeenCalledWith("a_tier");
      expect(mockLlm.generate).toHaveBeenCalledWith({
        system: "You are test-agent. Respond in JSON format: {thought, action}",
        prompt: "What is the plan?",
      });
    });

    test("should parse a valid JSON response from the LLM", async () => {
        const mockResponse = { thought: "The plan is to test.", action: "proceed" };
        mockLlm.generate.mockResolvedValue({ text: JSON.stringify(mockResponse) });

        const result = await getCompletion("test-agent", "prompt");
        expect(result).toEqual(mockResponse);
      });

      test("should parse a valid JSON response wrapped in markdown code block", async () => {
        const mockResponse = { thought: "The plan is to test.", action: "proceed" };
        mockLlm.generate.mockResolvedValue({ text: "```json\n" + JSON.stringify(mockResponse) + "\n```"});

        const result = await getCompletion("test-agent", "prompt");
        expect(result).toEqual(mockResponse);
      });

    test("should handle non-JSON responses gracefully", async () => {
      mockLlm.generate.mockResolvedValue({ text: "This is not JSON." });

      const result = await getCompletion("test-agent", "prompt");
      expect(result).toEqual({
        thought: "My response wasn't valid JSON. Please try again.",
        action: null,
      });
    });

    test("should handle LLM errors gracefully", async () => {
        mockLlm.generate.mockRejectedValue(new Error("API limit reached"));

        const result = await getCompletion("test-agent", "prompt");
        expect(result).toEqual({
          thought: "I encountered an error: API limit reached",
          action: null,
        });
      });

      test("should handle empty or unexpected LLM response structure", async () => {
        mockLlm.generate.mockResolvedValue({ choices: [] }); // Empty choices array

        const result = await getCompletion("test-agent", "prompt");
        expect(result).toEqual({
          thought: "Error: Received an empty response from the LLM.",
          action: null,
        });
        expect(console.error).toHaveBeenCalled();
      });
  });

  describe("getSystemPrompt", () => {
    test("should return a non-empty string", async () => {
      const prompt = await getSystemPrompt();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe("clearFileCache", () => {
    // This is harder to test without exporting the cache.
    // For now, we just test that it doesn't throw an error.
    test("should run without errors", () => {
      expect(() => clearFileCache()).not.toThrow();
    });
  });

  describe("decomposeGoal", () => {
    test("should return a list of tasks", async () => {
      const goal = "Test the decomposer";
      const tasks = await decomposeGoal(goal);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0]).toHaveProperty("id");
      expect(tasks[0]).toHaveProperty("description");
    });
  });
});
