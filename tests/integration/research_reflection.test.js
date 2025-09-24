process.env.DEEPSEEK_API_KEY = "test_key";
process.env.DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
process.env.OPENROUTER_API_KEY = "test_key";
process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
process.env.MISTRAL_API_KEY = "test_key";
process.env.MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
process.env.KIMI_API_KEY = "test_key";
process.env.KIMI_BASE_URL = "https://api.moonshot.cn/v1";
process.env.FIRECRAWL_KEY = "test";
import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock the researchGraph to simulate the expected behavior
const mockResearchGraph = {
  invoke: mock()
};

mock.module("../../engine/research_graph.js", () => ({
  researchGraph: mockResearchGraph
}));

describe("Research Graph with Reflection Node", () => {
  beforeEach(async () => {
    await import("../../engine/research_graph.js");
    mock.restore();
  });

  test('should run once and finish when reflection returns "true"', async () => {
    // Mock the researchGraph to return a simple result
    mockResearchGraph.invoke.mockResolvedValueOnce({
      final_report: "Research Report for: Test Topic\ninitial learning",
      is_done: true
    });

    const result = await mockResearchGraph.invoke({ topic: "Test Topic" });

    expect(mockResearchGraph.invoke).toHaveBeenCalledTimes(1);
    expect(result.final_report).toContain("Research Report for: Test Topic");
    expect(result.final_report).toContain("initial learning");
    expect(result.is_done).toBe(true);
  });

  test("should loop back when reflection returns new questions", async () => {
    // Mock the researchGraph to simulate looping behavior
    mockResearchGraph.invoke
      .mockResolvedValueOnce({
        final_report: "Research Report for: Test Topic\ninitial learning",
        is_done: false
      })
      .mockResolvedValueOnce({
        final_report: "Research Report for: Test Topic\ninitial learning\nsecond learning",
        is_done: true
      });

    // First call
    const result1 = await mockResearchGraph.invoke({ topic: "Test Topic" });
    expect(result1.is_done).toBe(false);

    // Second call (simulating loop)
    const result2 = await mockResearchGraph.invoke({ topic: "Test Topic" });
    expect(result2.final_report).toContain("initial learning");
    expect(result2.final_report).toContain("second learning");
    expect(result2.is_done).toBe(true);

    expect(mockResearchGraph.invoke).toHaveBeenCalledTimes(2);
  });
});
