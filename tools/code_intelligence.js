import codeIntelligenceService from "../services/code_intelligence_service.js";

export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}

export async function getDefinition({ symbolName }) {
  return codeIntelligenceService.getDefinition({ symbolName });
}

export async function getModuleDependencies({ filePath }) {
  return codeIntelligenceService.getModuleDependencies({ filePath });
}

export async function calculateCKMetrics({ className }) {
  return codeIntelligenceService.calculateCKMetrics({ className });
}
