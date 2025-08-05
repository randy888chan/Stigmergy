import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import codeIntelligenceService from "../services/code_intelligence_service.js";

/**
 * Fallback verification that works without Neo4j
 * Used when Neo4j is unavailable but verification is still needed
 */
class FallbackVerifier {
  constructor() {
    this.codeIntelligence = codeIntelligenceService;
  }

  /**
   * Verify code standards compliance using file system checks
   */
  async verifyCodeStandards(projectPath) {
    try {
      // Check for existence of coding standards document
      const standardsPath = path.join(projectPath, "docs", "architecture", "coding-standards.md");
      const hasStandards = await fs.pathExists(standardsPath);

      // Basic file structure check
      const srcExists = await fs.pathExists(path.join(projectPath, "src"));
      const testsExist = await fs.pathExists(path.join(projectPath, "tests"));

      // Check for common test files
      const testFiles = await glob("**/*.{test,spec}.{js,ts}", {
        cwd: projectPath,
        absolute: true,
      });

      return {
        success: true,
        artifacts: {
          hasCodingStandards: hasStandards,
          hasSrcDirectory: srcExists,
          hasTestsDirectory: testsExist,
          testFileCount: testFiles.length,
        },
        warnings: !hasStandards ? ["Coding standards document not found"] : [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Fallback verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Verify PRD completeness using file existence checks
   */
  async verifyPrdCompleteness(projectPath) {
    try {
      const requiredDocs = ["docs/brief.md", "docs/prd.md", "docs/architecture.md"];

      const checks = await Promise.all(
        requiredDocs.map(async (doc) => ({
          path: doc,
          exists: await fs.pathExists(path.join(projectPath, doc)),
        }))
      );

      const missingDocs = checks.filter((check) => !check.exists).map((check) => check.path);

      return {
        success: missingDocs.length === 0,
        artifacts: checks,
        warnings:
          missingDocs.length > 0 ? [`Missing required documents: ${missingDocs.join(", ")}`] : [],
      };
    } catch (error) {
      return {
        success: false,
        error: `PRD verification failed: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
export default new FallbackVerifier();
