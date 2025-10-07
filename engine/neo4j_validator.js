import { unifiedIntelligenceService } from '../services/unified_intelligence.js';

export class Neo4jValidator {
  static async validate() {
    console.log("Checking Unified Intelligence Service connection...");

    // The unifiedIntelligenceService is a singleton, so we can use it directly.
    const result = await unifiedIntelligenceService.testConnection();

    if (result.status === 'ok') {
      console.log(` -> Unified Intelligence Service status OK: ${result.message}`);
      return { success: true };
    } else {
        return {
            success: false,
            error: `Unified Intelligence Service connection failed: ${result.message}`,
        };
    }
  }
}