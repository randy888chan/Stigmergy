import { mock } from "bun:test";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";

console.log("--- [SETUP] Applying global mock for UnifiedIntelligenceService ---");

// This is the definitive fix for the E2E test failures.
// By mocking the *entire module*, we ensure that any part of the application
// that imports this service during a test run will receive the mock instead
// of the real implementation. This prevents any unwanted side effects,
// such as network requests or complex initialization logic.

mock.module("../services/unified_intelligence.js", () => {
  console.log("--- [MOCK] UnifiedIntelligenceService module is being mocked ---");
  return {
    unifiedIntelligenceService: {
      initialize: async () => {
        console.log("[MOCK] unifiedIntelligenceService.initialize called");
      },
      scanCodebase: async (args) => {
        console.log("[MOCK] unifiedIntelligenceService.scanCodebase called with:", args);
        // Return a structure that matches what the real service would return
        return { report: "Mocked codebase scan successful." };
      },
      calculateMetrics: async () => {
        console.log("[MOCK] unifiedIntelligenceService.calculateMetrics called");
        return { metrics: "Mocked metrics report." };
      },
      semanticSearch: async (args) => {
        console.log("[MOCK] unifiedIntelligenceService.semanticSearch called with:", args);
        return [{ file: "mock/file.js", score: 0.9, summary: "Mock search result." }];
      },
      findArchitecturalIssues: async () => {
        console.log("[MOCK] unifiedIntelligenceService.findArchitecturalIssues called");
        return [{ issue: "Mocked architectural issue." }];
      },
      testConnection: async () => {
        console.log("[MOCK] unifiedIntelligenceService.testConnection called");
        return { status: 'ok', message: 'Mock connection successful.' };
      },
      runRawQuery: async (query, params) => {
        console.log("[MOCK] unifiedIntelligenceService.runRawQuery called with:", query, params);
        return [{ result: "Mock query result." }];
      }
    },
  };
});
