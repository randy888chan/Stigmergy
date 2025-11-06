export const unifiedIntelligenceService = {
  isInitialized: true,
  scanCodebase: async () => ({ report: "Mock codebase scan report." }),
  semanticSearch: async () => ({ results: [], condensed_preamble: "Mock search results." }),
  calculateMetrics: async () => ({ metrics: "Mock metrics." }),
  findArchitecturalIssues: async () => ([]),
  testConnection: async () => ({ status: 'ok', message: 'Mock connection successful.' }),
  runRawQuery: async () => ([]),
};
