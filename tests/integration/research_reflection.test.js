process.env.DEEPSEEK_API_KEY = "test_key";
process.env.DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
process.env.OPENROUTER_API_KEY = "test_key";
process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
process.env.MISTRAL_API_KEY = "test_key";
process.env.MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
process.env.KIMI_API_KEY = "test_key";
process.env.KIMI_BASE_URL = "https://api.moonshot.cn/v1";
process.env.FIRECRAWL_KEY = "test";
import { jest } from "@jest/globals";
import { researchGraph } from "../../engine/research_graph.js";

// Mock the AI model and Firecrawl client
const mockGenerateObject = jest.fn();
jest.mock("ai", () => ({
  generateObject: (options) => mockGenerateObject(options),
}));

const mockFirecrawlSearch = jest.fn();
jest.mock("@mendable/firecrawl-js", () => {
  return jest.fn().mockImplementation(() => {
    return { search: mockFirecrawlSearch };
  });
});

describe("Research Graph with Reflection Node", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirecrawlSearch.mockResolvedValue({
      data: [{ url: "mock.url", markdown: "mock markdown content" }],
    });
  });

  test('should run once and finish when reflection returns "true"', async () => {
    // 1. Initial query generation
    mockGenerateObject.mockResolvedValueOnce({ object: { query: "initial query" } });
    // 2. Synthesize results
    mockGenerateObject.mockResolvedValueOnce({ object: { newLearnings: ["initial learning"] } });
    // 3. Reflection node -> "true"
    mockGenerateObject.mockResolvedValueOnce({ object: { response: "true" } });

    const result = await researchGraph.invoke({ topic: "Test Topic" });

    expect(mockGenerateObject).toHaveBeenCalledTimes(3);
    expect(result.final_report).toContain("Research Report for: Test Topic");
    expect(result.final_report).toContain("initial learning");
    expect(result.is_done).toBe(true);
  });

  test("should loop back when reflection returns new questions", async () => {
    // First loop
    mockGenerateObject.mockResolvedValueOnce({ object: { query: "initial query" } });
    mockGenerateObject.mockResolvedValueOnce({ object: { newLearnings: ["initial learning"] } });
    mockGenerateObject.mockResolvedValueOnce({ object: { response: ["new question?"] } });

    // Second loop
    mockGenerateObject.mockResolvedValueOnce({ object: { newLearnings: ["second learning"] } });
    mockGenerateObject.mockResolvedValueOnce({ object: { response: "true" } });

    const result = await researchGraph.invoke({ topic: "Test Topic" });

    // generateSearchQuery (1), synthesize (1), reflect (1) -> loop
    // synthesize (1), reflect (1) -> end
    expect(mockGenerateObject).toHaveBeenCalledTimes(5);
    expect(result.final_report).toContain("initial learning");
    expect(result.final_report).toContain("second learning");
    expect(result.is_done).toBe(true);

    expect(mockFirecrawlSearch).toHaveBeenCalledTimes(2);
    expect(mockFirecrawlSearch).toHaveBeenCalledWith("initial query", expect.any(Object));
    expect(mockFirecrawlSearch).toHaveBeenCalledWith("new question?", expect.any(Object));
  });
});
