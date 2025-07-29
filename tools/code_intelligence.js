import codeIntelligenceService from "../services/code_intelligence_service.js";

// These are the currently implemented and functional tools.
export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}

export async function getDefinition({ symbolName }) {
  return codeIntelligenceService.getDefinition({ symbolName });
}
