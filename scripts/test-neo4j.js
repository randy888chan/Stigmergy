import { CodeIntelligenceService } from "../services/code_intelligence_service.js";

export async function testNeo4j() {
  const codeIntelligenceService = new CodeIntelligenceService();
  codeIntelligenceService.initializeDriver();
  try {
    const result = await codeIntelligenceService.testConnection();

    if (result.success && result.type === "connected") {
      console.log("✅ Neo4j connection verified");
      return { success: true };
    } else if (result.success && result.type === "memory") {
      console.log("✅ Neo4j running in memory mode.");
      return { success: true };
    }
    else {
      console.error("❌ Neo4j connection failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Test failed completely:", error);
    return { success: false, error: error };
  }
}
