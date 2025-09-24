import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule("@mendable/firecrawl-js", () => ({
  default: jest.fn(),
}));
jest.unstable_mockModule("ai", () => ({
  generateObject: jest.fn(),
}));
jest.unstable_mockModule("axios", () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
jest.unstable_mockModule("fs-extra", () => ({
  default: {
    readFile: jest.fn(),
  },
}));
jest.unstable_mockModule("../../../ai/providers.js", () => ({
  getModelForTier: jest.fn(),
}));

describe("Research Tools", () => {
  let deep_dive, analyze_user_feedback, _resetCache;
  let FirecrawlApp, generateObject, axios, fs, getModelForTier;

  beforeEach(async () => {
    // Dynamically import modules after mocks are set up
    const researchTools = await import("../../../tools/research.js");
    deep_dive = researchTools.deep_dive;
    analyze_user_feedback = researchTools.analyze_user_feedback;
    _resetCache = researchTools._resetCache;

    FirecrawlApp = (await import("@mendable/firecrawl-js")).default;
    generateObject = (await import("ai")).generateObject;
    axios = (await import("axios")).default;
    fs = (await import("fs-extra")).default;
    getModelForTier = (await import("../../../ai/providers.js")).getModelForTier;

    // Reset mocks before each test
    jest.clearAllMocks();
    _resetCache();

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
      axios.get.mockResolvedValue({ status: 200, data: { status: "healthy" } });
      axios.post.mockResolvedValue({ data: { results: [{ url: "test.com", content: "Archon content" }] } });
      generateObject.mockResolvedValue({ object: { newLearnings: ["learning"], next_research_queries: ["query"] } });

      const result = await deep_dive({ query: "test" });

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/health"), expect.any(Object));
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/rag/query"), expect.any(Object));
      expect(result.sources).toEqual(["test.com"]);
    });

    test("should fall back to Firecrawl if Archon health check fails", async () => {
        axios.get.mockRejectedValue(new Error("Network error"));
        const mockFirecrawlClient = { search: jest.fn().mockResolvedValue({ data: [{ url: "fire.com", markdown: "Firecrawl content" }] }) };
        FirecrawlApp.mockImplementation(() => mockFirecrawlClient);
        generateObject.mockResolvedValue({ object: { query: "search", newLearnings: ["learning"], next_research_queries: ["query"] } });

        const result = await deep_dive({ query: "test" });

        expect(axios.get).toHaveBeenCalled();
        expect(mockFirecrawlClient.search).toHaveBeenCalled();
        expect(result.sources).toEqual(["fire.com"]);
      });

      test("should handle research failure gracefully", async () => {
        axios.get.mockRejectedValue(new Error("Network error"));
        FirecrawlApp.mockImplementation(() => {
            throw new Error("Firecrawl client error");
        });

        const result = await deep_dive({ query: "test" });
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
