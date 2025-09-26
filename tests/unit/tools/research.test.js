import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';

// Mock dependencies using the ESM-compatible API
mock.module("@mendable/firecrawl-js", () => ({
  default: mock(),
}));
mock.module("ai", () => ({
  generateObject: mock(),
}));
mock.module('fs-extra', async () => {
  const memfs = await import('memfs'); // Use ESM import for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: memfs.fs.exists.bind(null),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        readFile: mock(),
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
        pathExists: memfs.fs.exists.bind(null),
    }
  };
});
mock.module("../../../ai/providers.js", () => ({
  getModelForTier: mock(),
}));

describe("Research Tools", () => {
  let deep_dive, analyze_user_feedback, _resetCache;
  let FirecrawlApp, generateObject, fs, getModelForTier;

  beforeEach(async () => {
    // Dynamically import modules after mocks are set up
    const researchTools = await import("../../../tools/research.js");
    deep_dive = researchTools.deep_dive;
    analyze_user_feedback = researchTools.analyze_user_feedback;

    FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
    generateObject = (await import("ai")).generateObject;
    fs = (await import("fs-extra")).default;
    getModelForTier = (await import("../../../ai/providers.js")).getModelForTier;

    // Reset mocks before each test
    mock.restore();
    researchTools._resetCache();

    // Mock the research prompt file
    fs.readFile.mockResolvedValue("```yaml\nresearch_prompt: 'Test prompt'\n```");
    // Set a dummy key for the test environment
    process.env.FIRECRAWL_KEY = "test-key";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.FIRECRAWL_KEY;
  });

  describe("deep_dive", () => {
    test("should use Archon if available", async () => {
        const mockAxios = {
            get: mock().mockResolvedValue({ status: 200, data: { status: "healthy" } }),
            post: mock().mockResolvedValue({ data: { results: [{ url: "test.com", content: "Archon content" }] } }),
        };
      generateObject.mockResolvedValue({ object: { newLearnings: ["learning"], next_research_queries: ["query"] } });

      const result = await deep_dive({ query: "test", axios: mockAxios });

      expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining("/health"), expect.any(Object));
      expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining("/rag/query"), expect.any(Object));
      expect(result.sources).toEqual(["test.com"]);
    });

    test("should fall back to Firecrawl if Archon health check fails", async () => {
        const mockAxios = {
            get: mock().mockRejectedValue(new Error("Network error")),
        };
        const mockFirecrawlClient = { search: mock().mockResolvedValue({ data: [{ url: "fire.com", markdown: "Firecrawl content" }] }) };
        FirecrawlApp.mockImplementation(() => mockFirecrawlClient);
        generateObject.mockResolvedValue({ object: { query: "search", newLearnings: ["learning"], next_research_queries: ["query"] } });

        const result = await deep_dive({ query: "test", axios: mockAxios });

        expect(mockAxios.get).toHaveBeenCalled();
        expect(mockFirecrawlClient.search).toHaveBeenCalled();
        expect(result.sources).toEqual(["fire.com"]);
      });

      test("should handle research failure gracefully", async () => {
        const mockAxios = {
            get: mock().mockRejectedValue(new Error("Network error")),
        };
        FirecrawlApp.mockImplementation(() => {
            throw new Error("Firecrawl client error");
        });

        const result = await deep_dive({ query: "test", axios: mockAxios });
        expect(result.new_learnings).toEqual([]);
        expect(result.next_research_queries).toEqual([]);
      });
  });

  describe("analyze_user_feedback", () => {
    test("should call generateObject and return its result", async () => {
      const mockResponse = {
        personas: [{ name: "tester", description: "A test user", goals: ["testing"] }],
        pain_points: ["Too much testing"],
      };
      generateObject.mockResolvedValue({ object: mockResponse });

      const result = await analyze_user_feedback({ research_data: "I am a test user" });

      expect(getModelForTier).toHaveBeenCalledWith("b_tier");
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});