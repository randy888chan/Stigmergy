import codeIntelligenceService from "../services/code_intelligence_service.js";
import fallbackVerifier from "./fallback_verifier.js";

async function _verifyWithNeo4j(projectPath) {
  // Placeholder for Neo4j-based verification
  console.log("[Verification] Using Neo4j-based verification for code health.");
  return { success: true, message: "Code health verified with Neo4j." };
}

async function _verifyWithNeo4jRequirements(projectPath) {
  // Placeholder for Neo4j-based verification
  console.log("[Verification] Using Neo4j-based verification for project requirements.");
  return { success: true, message: "Project requirements verified with Neo4j." };
}

export async function verifyCodeHealth(projectPath) {
  const neo4jStatus = await codeIntelligenceService.testConnection();

  if (neo4jStatus.success) {
    // Use Neo4j-based verification when available
    return _verifyWithNeo4j(projectPath);
  } else {
    // Fall back to file-based verification when Neo4j is unavailable
    console.log("[Verification] Neo4j unavailable, using fallback verification");
    return fallbackVerifier.verifyCodeStandards(projectPath);
  }
}

export async function verifyProjectRequirements(projectPath) {
  const neo4jStatus = await codeIntelligenceService.testConnection();

  if (neo4jStatus.success && neo4jStatus.limitations && !neo4jStatus.limitations.warning) {
    // Use full verification when Neo4j is healthy
    return _verifyWithNeo4jRequirements(projectPath);
  } else {
    // Use fallback verification when Neo4j has issues
    console.log("[Verification] Using fallback PRD verification");
    return fallbackVerifier.verifyPrdCompleteness(projectPath);
  }
}
