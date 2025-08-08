import codeIntelligenceService from '../services/code_intelligence_service.js';

export async function testNeo4j() {
  try {
    const result = await codeIntelligenceService.testConnection();

    if (result.success && result.type === 'connected') {
      console.log("✅ Neo4j connection verified");
      process.exit(0);
    } else {
      console.error("❌ Neo4j connection failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed completely:", error);
    process.exit(1);
  }
}

testNeo4j();
