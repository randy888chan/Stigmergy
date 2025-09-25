import { mock, describe, test, expect, beforeAll, afterAll, beforeEach, spyOn, afterEach } from 'bun:test';
import yaml from 'js-yaml';
import path from 'path';

// Mock dependencies before any imports
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
        readFile: mock(),
        pathExists: mock(),
        readdir: mock(),
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    }
  };
});
mock.module("../../../ai/providers.js", () => ({
  getModelForTier: mock(),
}));

// Now, import the modules we need to test
import * as llmAdapter from "../../../engine/llm_adapter.js";
import * as providers from "../../../ai/providers.js";
import fs from "fs-extra";


describe("LLM Adapter", () => {
  let consoleErrorSpy;
  let mockLlm;

  beforeEach(() => {
    // Suppress console output during these tests
    spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});

    // Setup a mock LLM that can be returned by the provider
    mockLlm = {
      generate: mock(),
    };
    providers.getModelForTier.mockReturnValue(mockLlm);

    // Mock fs.readFile for agent definitions and shared context
    fs.readFile.mockImplementation((filePath) => {
        const fPath = String(filePath);
        if (fPath.includes('test-agent.md')) {
            const mockAgentContent = { agent: { model_tier: 'a_tier' } };
            const yamlString = yaml.dump(mockAgentContent);
            return Promise.resolve("```yaml\n" + yamlString + "\n```");
        }
        if (fPath.includes('00_System_Goal.md')) {
            return Promise.resolve("System Goal Content");
        }
        if (fPath.includes('01_System_Architecture.md')) {
            return Promise.resolve("System Architecture Content");
        }
        // Add a catch-all for any other files
        if (fPath.includes('.md')) {
            return Promise.resolve("Default mock content");
        }
        return Promise.reject(new Error(`File not found: ${fPath}`));
    });

    // Mock readdir to return different files for different directories
    fs.readdir.mockImplementation(async (dirPath) => {
        const p = String(dirPath);
        if (p.endsWith('system_docs')) {
            return ['00_System_Goal.md', '01_System_Architecture.md'];
        }
        if (p.endsWith('docs')) {
            return ['prd.md'];
        }
        return [];
    });
    fs.pathExists.mockResolvedValue(true);
  });

  afterEach(() => {
    // Restore all mocks and clear caches between tests
    mock.restore();
    llmAdapter.clearFileCache();
    consoleErrorSpy.mockRestore();
  });

  describe("getSharedContext", () => {
    test("should read and concatenate the content of the documentation files", async () => {
      const context = await llmAdapter.getSharedContext();
      expect(context).toContain("--- START .stigmergy-core/system_docs/00_System_Goal.md ---");
      expect(context).toContain("System Goal Content");
      expect(context).toContain("--- START .stigmergy-core/system_docs/01_System_Architecture.md ---");
      expect(context).toContain("System Architecture Content");
      expect(context).toContain("--- START docs/prd.md ---");
    });

    test("should use the cache to avoid reading the same file multiple times", async () => {
        await llmAdapter.getSharedContext();
        await llmAdapter.getSharedContext();
        // Called for each file in the two mocked directories (system_docs and docs)
        expect(fs.readFile).toHaveBeenCalledTimes(3);
      });

      test("should handle missing files gracefully", async () => {
        // Only pretend one directory exists
        fs.readdir.mockImplementation(async (dirPath) => {
            const p = String(dirPath);
            if (p.endsWith('system_docs')) {
                return ['00_System_Goal.md'];
            }
            return [];
        });
        const context = await llmAdapter.getSharedContext();
        expect(context).toContain("System Goal Content");
        expect(context).not.toContain("System Architecture Content");
        // readdir is called for each doc directory, readFile is called once for the file that exists
        expect(fs.readdir).toHaveBeenCalledTimes(5);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
      });
  });

  describe("getCompletion", () => {
    test("should call the LLM with the correct agent-specific model tier", async () => {
      mockLlm.generate.mockResolvedValue({ text: '{"thought": "test", "action": "test"}' });

      await llmAdapter.getCompletion("test-agent", "What is the plan?");

      expect(providers.getModelForTier).toHaveBeenCalledWith("a_tier");
      expect(mockLlm.generate).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.any(String),
      }));
    });

    test("should parse a valid JSON response from the LLM", async () => {
        const mockResponse = { thought: "The plan is to test.", action: "proceed" };
        mockLlm.generate.mockResolvedValue({ text: JSON.stringify(mockResponse) });

        const result = await llmAdapter.getCompletion("test-agent", "prompt");
        expect(result).toEqual(mockResponse);
      });

    test("should parse a valid JSON response wrapped in markdown code block", async () => {
        const mockResponse = { thought: "The plan is to test.", action: "proceed" };
        mockLlm.generate.mockResolvedValue({ text: "```json\n" + JSON.stringify(mockResponse) + "\n```"});

        const result = await llmAdapter.getCompletion("test-agent", "prompt");
        expect(result).toEqual(mockResponse);
    });

    test("should handle non-JSON responses gracefully", async () => {
      mockLlm.generate.mockResolvedValue({ text: "This is not JSON." });

      const result = await llmAdapter.getCompletion("test-agent", "prompt");
      expect(result).toEqual({
        thought: "My response wasn't valid JSON. Please try again.",
        action: null,
      });
    });

    test("should handle LLM errors gracefully", async () => {
        mockLlm.generate.mockRejectedValue(new Error("API limit reached"));

        const result = await llmAdapter.getCompletion("test-agent", "prompt");
        expect(result).toEqual({
          thought: "I encountered an error: API limit reached",
          action: null,
        });
    });

    test("should handle empty or unexpected LLM response structure", async () => {
        mockLlm.generate.mockResolvedValue({ choices: [] }); // Empty choices array

        const result = await llmAdapter.getCompletion("test-agent", "prompt");
        expect(result).toEqual({
          thought: "Error: Received an empty response from the LLM.",
          action: null,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("LLM response did not contain expected text or content field:"), expect.any(Object));
    });
  });

  describe("getSystemPrompt", () => {
    test("should return a non-empty string", async () => {
      const prompt = await llmAdapter.getSystemPrompt();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe("clearFileCache", () => {
    test("should clear the cache", async () => {
        const filePath = path.join(process.cwd(), '.stigmergy-core', 'system_docs', '00_System_Goal.md');
        await llmAdapter.getCachedFile(filePath); // First call, reads from mock fs
        llmAdapter.clearFileCache();
        await llmAdapter.getCachedFile(filePath); // Second call, should also read from mock fs
        expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe("decomposeGoal", () => {
    test("should return a list of tasks", async () => {
        mockLlm.generate.mockResolvedValue({ text: JSON.stringify({
            tasks: [{ id: "task-1", description: "First task" }]
        })});
      const goal = "Test the decomposer";
      const tasks = await llmAdapter.decomposeGoal(goal);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0]).toHaveProperty("id");
      expect(tasks[0]).toHaveProperty("description");
    });
  });
});
