import { test, expect, describe, mock, spyOn, afterEach, beforeAll, afterAll } from 'bun:test';
import { enhance, _private } from "../../../engine/context_enhancer.js";
import * as codeIntelligence from "../../../tools/code_intelligence.js";

const { extractSymbolsFromTask, getContextForSymbols } = _private;

mock.module("../../../tools/code_intelligence.js", () => ({
  getDefinition: mock(),
  findUsages: mock(),
}));

describe("Context Enhancer", () => {
  let consoleErrorSpy;
  beforeAll(() => {
    spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  afterEach(() => {
    mock.restore();
  });

  // ... (other tests in the file remain the same)

  test("should handle errors during context fetching", async () => {
    codeIntelligence.getDefinition.mockRejectedValue(new Error("DB error"));
    const context = await getContextForSymbols(["ErrorSymbol"]);
    expect(context).toContain("--- Error retrieving context for symbol: `ErrorSymbol` ---");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // ... (other tests in the file remain the same)
});
