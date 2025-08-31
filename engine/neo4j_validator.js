import { CodeIntelligenceService } from '../services/code_intelligence_service.js';

export class Neo4jValidator {
  static async validate() {
    console.log("Checking Neo4j connection...");
    const codeIntel = new CodeIntelligenceService();
    const result = await codeIntel.testConnection();

    if (result.status === 'ok') {
      console.log(` -> Neo4j status OK: ${result.message}`);
      return { success: true };
    } else {
        return {
            success: false,
            error: `Neo4j connection failed: ${result.message}`,
        };
    }
  }
}
