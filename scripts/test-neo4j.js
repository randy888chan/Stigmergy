import codeIntelligenceService from '../services/code_intelligence_service.js';

export async function testNeo4j() {
  try {
    const result = await codeIntelligenceService.testConnection();

    // FIX: Properly handle test output
    if (result.success) {
      console.log("Neo4j connection successful!");
      process.exit(0);
    } else {
      console.error("Neo4j connection failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed completely:", error);
    process.exit(1);
  }
}

testNeo4j();
