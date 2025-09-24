import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import yaml from 'js-yaml';
import path from 'path';

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule("fs-extra", () => ({
  default: {
    readFile: jest.fn(),
    pathExists: jest.fn(),
  },
}));
jest.unstable_mockModule("../../../ai/providers.js", () => ({
  getModelForTier: jest.fn(),
}));

describe("LLM Adapter", () => {
  let getCompletion, getSystemPrompt, clearFileCache, decomposeGoal, getSharedContext, getCachedFile;
  let getModelForTier;
  let fs;
  let mockLlm;

  beforeAll(() => {
    // Suppress console output during these tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    // Dynamically import modules to get mocked versions
    const llmAdapter = await import("../../../engine/llm_adapter.js");
    getCompletion = llmAdapter.getCompletion;
    getSystemPrompt = llmAdapter.getSystemPrompt;
    clearFileCache = llmAdapter.clearFileCache;
    decomposeGoal = llmAdapter.decomposeGoal;
    getSharedContext = llmAdapter.getSharedContext;
    getCachedFile = llmAdapter.getCachedFile;

    getModelForTier = (await import("../../../ai/providers.js")).getModelForTier;
    fs = (await import("fs-extra")).default;

    // Reset mocks before each test
    jest.clearAllMocks();
    clearFileCache();

    // Setup a mock LLM that can be returned by the provider
    mockLlm = {
      generate: jest.fn(),
    };
    getModelForTier.mockReturnValue(mockLlm);

    // Mock fs.readFile for agent definitions
    fs.readFile.mockImplementation((filePath) => {
        if (String(filePath).includes('test-agent.md')) {
            const mockAgentContent = { agent: { model_tier: 'a_tier' } };
            const yamlString = yaml.dump(mockAgentContent);
            return Promise.resolve("```yaml\n" + yamlString + "\n```");
        }
        // For getSharedContext
        if (String(filePath).includes('00_System_Goal.md')) {
            return Promise.resolve("System Goal Content");
        }
        if (String(filePath).includes('01_System_Architecture.md')) {
            return Promise.resolve("System Architecture Content");
        }
        return Promise.reject(new Error("File not found"));
    });

    fs.pathExists.mockImplementation((filePath) => {
        return Promise.resolve(
            String(filePath).includes('test-agent.md') ||
            String(filePath).includes('00_System_Goal.md') ||
            String(filePath).includes('01_System_Architecture.md')
        );
    });
  });

  describe("getSharedContext", () => {
    test("should read and concatenate the content of the documentation files", async () => {
      const context = await getSharedContext();
      expect(context).toContain("--- START .stigmergy-core/system_docs/00_System_Goal.md ---");
      expect(context).toContain("System Goal Content");
      expect(context).toContain("--- START .stigmergy-core/system_docs/01_System_Architecture.md ---");
      expect(context).toContain("System Architecture Content");
    });

    test("should use the cache to avoid reading the same file multiple times", async () => {
        await getSharedContext();
        await getSharedContext();
        // fs.readFile should be called once for each existing file
        expect(fs.readFile).toHaveBeenCalledTimes(2);
      });
  
      test("should handle missing files gracefully", async () => {
        // The mock for pathExists will return false for other files
        const context = await getSharedContext();
        expect(context).not.toContain("brief.md");
      });
  });

  describe("getCompletion", () => {
    test("should call the LLM with the correct agent-specific model tier", async () => {
      mockLlm.generate.mockResolvedValue({ text: '{"thought": "test", "action": "test"}' });

      await getCompletion("test-agent", "What is the plan?");

      expect(getModelForTier).toHaveBeenCalledWith("a_tier");
      expect(mockLlm.generate).toHaveBeenCalledWith(expect.objectContaining({
        prompt: "What is the plan?",
      }));
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
    test("should clear the cache", async () => {
        const filePath = path.join(process.cwd(), '.stigmergy-core', 'system_docs', '00_System_Goal.md');
        await getCachedFile(filePath);
        clearFileCache();
        await getCachedFile(filePath);
        expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe("decomposeGoal", () => {
    test("should return a list of tasks", async () => {
        mockLlm.generate.mockResolvedValue({ text: JSON.stringify({
            tasks: [{ id: "task-1", description: "First task" }]
        })});
      const goal = "Test the decomposer";
      const tasks = await decomposeGoal(goal);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0]).toHaveProperty("id");
      expect(tasks[0]).toHaveProperty("description");
    });
  });
});
