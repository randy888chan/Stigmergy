import codeIntelligenceService from "../services/code_intelligence_service.js";

export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}
export async function getDefinition({ symbolName }) {
  return codeIntelligenceService.getDefinition({ symbolName });
}
export async function getModuleDependencies({ filePath }) {
  return ["/src/utils.js", "/src/config.js"];
}
export async function calculateCKMetrics({ className }) {
  return { wmc: 15, dit: 3, noc: 2, cbo: 8, rfc: 25, lcom: 0.8 };
}
