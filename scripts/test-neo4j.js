import codeIntelligenceService from "../services/code_intelligence_service.js";

export async function testNeo4j() {
  try {
    const result = await codeIntelligenceService.testConnection();

    if (result.success && result.type === "connected") {
      console.log("✅ Neo4j connection verified");
      return { success: true };
    } else {
      console.error("❌ Neo4j connection failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Test failed completely:", error);
    return { success: false, error: error };
  }
}
