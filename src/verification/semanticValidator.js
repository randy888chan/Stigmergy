import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import fs from "fs-extra";

export class SemanticValidator {
  async validateCodeQuality(filePath) {
    const code = await fs.readFile(filePath, "utf-8");
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const issues = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.body.body.length > 50) {
          issues.push({
            type: "complexity",
            message: "Function exceeds 50 lines",
            line: path.node.loc.start.line,
          });
        }
      },
      ImportDeclaration(path) {
        if (path.node.source.value.includes("..")) {
          issues.push({
            type: "structure",
            message: "Avoid relative imports with ..",
            line: path.node.loc.start.line,
          });
        }
      },
    });

    return {
      valid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 10),
    };
  }

  async validateBusinessOutcomes(projectPath, goal) {
    const outcomes = await this.extractBusinessOutcomes(goal);
    const validations = [];

    for (const outcome of outcomes) {
      const validation = await this.validateOutcome(projectPath, outcome);
      validations.push(validation);
    }

    return {
      overall: validations.every((v) => v.valid),
      validations,
    };
  }
}
