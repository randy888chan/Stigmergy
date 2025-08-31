import { enhance, _private } from "../../../engine/context_enhancer.js";
import * as codeIntelligence from "../../../tools/code_intelligence.js";

const { extractSymbolsFromTask, getContextForSymbols } = _private;

// Mock the code intelligence tool
jest.mock("../../../tools/code_intelligence.js", () => ({
  getDefinition: jest.fn(),
  findUsages: jest.fn(),
}));

// Suppress console.log during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe("Context Enhancer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("extractSymbolsFromTask", () => {
    test("should extract symbols from backticks, PascalCase, and camelCase", () => {
      const taskContent =
        "Please update the `UserComponent` and the `userService.getUser` function. Also check the `MAX_RETRIES` constant.";
      const expectedSymbols = ["UserComponent", "userService.getUser", "MAX_RETRIES"];
      const symbols = extractSymbolsFromTask(taskContent);
      // Use a Set for comparison to ignore order
      expect(new Set(symbols)).toEqual(new Set(expectedSymbols));
    });

    test("should return an empty array if no symbols are found", () => {
      const taskContent = "a normal sentence without any code";
      const symbols = extractSymbolsFromTask(taskContent);
      expect(symbols).toEqual([]);
    });
  });

  describe("getContextForSymbols", () => {
    test("should return context for found symbols", async () => {
      codeIntelligence.getDefinition.mockResolvedValue({
        file: "user.js",
        language: "javascript",
        definition: "class User {}",
      });
      codeIntelligence.findUsages.mockResolvedValue([
        { user: "profile.js", file: "profile.js", line: 10 },
      ]);

      const context = await getContextForSymbols(["User"]);
      expect(context).toContain("--- Context for symbol: `User` ---");
      expect(context).toContain("Definition found in user.js");
      expect(context).toContain("Found 1 usage(s)");
    });

    test("should handle symbols with no definition or usages", async () => {
        codeIntelligence.getDefinition.mockResolvedValue({ definition: null });
        codeIntelligence.findUsages.mockResolvedValue([]);

        const context = await getContextForSymbols(["NonExistentSymbol"]);
        expect(context).toContain("Definition not found in code graph.");
        expect(context).toContain("No usages found in the code graph.");
      });

    test("should handle errors during context fetching", async () => {
      codeIntelligence.getDefinition.mockRejectedValue(new Error("DB error"));
      const context = await getContextForSymbols(["ErrorSymbol"]);
      expect(context).toContain("--- Error retrieving context for symbol: `ErrorSymbol` ---");
      expect(console.error).toHaveBeenCalled();
    });

    test("should return a specific message if no symbols are provided", async () => {
        const context = await getContextForSymbols([]);
        expect(context).toBe("No specific code symbols were identified in the task.");
    });
  });

  describe("enhance", () => {
    test("should return an empty string if no symbols are found", async () => {
      const taskContent = "just a plain sentence";
      const result = await enhance(taskContent);
      expect(result).toBe("");
    });

    test("should return the enhanced context block if symbols are found", async () => {
        codeIntelligence.getDefinition.mockResolvedValue({
            file: "test.js",
            definition: "const myVar = 1;"
        });
        codeIntelligence.findUsages.mockResolvedValue([]);

        const taskContent = "Check `myVar`.";
        const result = await enhance(taskContent);

        expect(result).toContain("--- DYNAMIC CODE GRAPH CONTEXT ---");
        expect(result).toContain("Context for symbol: `myVar`");
        expect(result).toContain("--- END DYNAMIC CODE GRAPH CONTEXT ---");
    });
  });
});
