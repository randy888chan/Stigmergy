import { CodeIntelligenceService } from "../services/code_intelligence_service.js";

export async function testNeo4j() {
  const codeIntelligenceService = new CodeIntelligenceService();
  codeIntelligenceService.initializeDriver();
  try {
    const result = await codeIntelligenceService.testConnection();

    if (result.status === 'ok') {
      console.log(`✅ Neo4j status OK: ${result.message}`);
      return { success: true, message: result.message };
    } else {
      console.error(`❌ Neo4j connection failed: ${result.message}`);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Test failed completely:", error);
    return { success: false, error: error };
  }
}
