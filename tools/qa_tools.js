// Enhanced QA Tools for Stigmergy with TDD Enforcement and Static Analysis
import fs from 'fs-extra';
import path from 'path';
import { getModelForTier } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Run static analysis using ESLint
 */
export async function run_static_analysis({ filePaths, configPath = null }) {
  console.log('[QA] Running static analysis...');
  
  try {
    const { ESLint } = await import('eslint');
    
    const eslintConfig = configPath ? 
      { configFile: configPath } : 
      {
        baseConfig: {
          env: { node: true, es2022: true },
          extends: ['eslint:recommended'],
          parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
          rules: {
            'no-unused-vars': 'error',
            'no-undef': 'error',
            'complexity': ['warn', 10],
            'max-lines': ['warn', 300]
          }
        },
        useEslintrc: false
      };
    
    const eslint = new ESLint(eslintConfig);
    const results = await eslint.lintFiles(Array.isArray(filePaths) ? filePaths : [filePaths]);
    
    const issues = results.flatMap(result => 
      result.messages.map(msg => ({
        file: result.filePath,
        line: msg.line,
        column: msg.column,
        message: msg.message,
        severity: msg.severity === 2 ? 'error' : 'warning',
        rule: msg.ruleId
      }))
    );
    
    return {
      success: true,
      issues,
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
      filesAnalyzed: results.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues: []
    };
  }
}

/**
 * Enforce Test-Driven Development workflow
 */
export async function enforce_tdd_workflow({ sourceFile, testFile = null, requirementDescription = '' }) {
  console.log(`[QA] Enforcing TDD workflow for: ${sourceFile}`);
  
  try {
    const sourcePath = path.resolve(sourceFile);
    const sourceExists = await fs.pathExists(sourcePath);
    
    // Auto-detect test file if not provided
    if (!testFile) {
      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const dir = path.dirname(sourceFile);
      testFile = path.join(dir, `${baseName}.test.js`);
    }
    
    const testPath = path.resolve(testFile);
    const testExists = await fs.pathExists(testPath);
    
    const violations = [];
    
    // Check 1: Test file should exist
    if (!testExists) {
      violations.push({
        type: 'missing_test',
        message: `Test file not found: ${testFile}`,
        severity: 'error',
        fix: `Create test file with failing tests before implementing ${sourceFile}`
      });
    }
    
    // Check 2: If source exists, tests should have been written first
    if (sourceExists && testExists) {
      const sourceStat = await fs.stat(sourcePath);
      const testStat = await fs.stat(testPath);
      
      if (sourceStat.mtime < testStat.mtime) {
        violations.push({
          type: 'test_after_code',
          message: 'Test file was modified after source file - violates TDD red-green-refactor cycle',
          severity: 'warning',
          fix: 'In TDD, tests should be written and failing before implementation'
        });
      }
    }
    
    // Check 3: Test coverage analysis
    if (testExists) {
      const coverage = await analyze_test_coverage({ sourceFile, testFile });
      if (coverage.success && coverage.percentage < 80) {
        violations.push({
          type: 'low_coverage',
          message: `Test coverage is ${coverage.percentage}% - below 80% threshold`,
          severity: 'error',
          fix: 'Add more test cases to achieve minimum 80% coverage'
        });
      }
    }
    
    return {
      success: violations.length === 0,
      violations,
      tdd_compliant: violations.filter(v => v.type !== 'low_coverage').length === 0,
      coverage_compliant: violations.filter(v => v.type === 'low_coverage').length === 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      violations: []
    };
  }
}

/**
 * Enhanced coverage analysis with c8 integration
 */
export async function analyze_test_coverage({ sourceFile, testFile }) {
  console.log(`[QA] Analyzing test coverage for: ${sourceFile}`);
  
  try {
    // Create a temporary npm script to run the test with coverage
    const testCommand = `npx c8 --reporter=json --reporter=text-summary node ${testFile}`;
    
    const result = await execPromise(testCommand, {
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });
    
    // Parse coverage report from JSON
    const coverageDir = path.join(process.cwd(), 'coverage');
    const coverageFile = path.join(coverageDir, 'coverage-summary.json');
    
    if (await fs.pathExists(coverageFile)) {
      const coverageSummary = await fs.readJson(coverageFile);
      const totalCoverage = coverageSummary.total;
      
      // Also check file-specific coverage
      const sourceFilePath = path.resolve(sourceFile);
      const fileCoverage = Object.entries(coverageSummary)
        .find(([filePath]) => filePath === sourceFilePath)?.[1] || totalCoverage;
      
      return {
        success: true,
        percentage: Math.round(fileCoverage.lines?.pct || 0),
        statements: {
          percentage: Math.round(fileCoverage.statements?.pct || 0),
          covered: fileCoverage.statements?.covered || 0,
          total: fileCoverage.statements?.total || 0
        },
        branches: {
          percentage: Math.round(fileCoverage.branches?.pct || 0),
          covered: fileCoverage.branches?.covered || 0,
          total: fileCoverage.branches?.total || 0
        },
        functions: {
          percentage: Math.round(fileCoverage.functions?.pct || 0),
          covered: fileCoverage.functions?.covered || 0,
          total: fileCoverage.functions?.total || 0
        },
        lines: {
          percentage: Math.round(fileCoverage.lines?.pct || 0),
          covered: fileCoverage.lines?.covered || 0,
          total: fileCoverage.lines?.total || 0
        },
        output: result.stdout
      };
    }
    
    // Fallback: parse from text output
    const coverageMatch = result.stdout.match(/All files\s*\|\s*([\d.]+)/);    
    const percentage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    
    return {
      success: true,
      percentage,
      statements: { percentage, covered: 0, total: 0 },
      branches: { percentage: 0, covered: 0, total: 0 },
      functions: { percentage: 0, covered: 0, total: 0 },
      lines: { percentage, covered: 0, total: 0 },
      output: result.stdout
    };
  } catch (error) {
    console.warn('Coverage analysis failed:', error.message);
    return {
      success: false,
      error: error.message,
      percentage: 0,
      output: error.stdout || error.message
    };
  }
}

/**
 * Comprehensive quality verification - main entry point for QA agent
 */
export async function verify_comprehensive_quality({ sourceFile, testFile, briefFile, requirements = '' }) {
  console.log(`[QA] Running comprehensive quality verification for: ${sourceFile}`);
  
  const results = {
    overall_pass: false,
    tdd_compliance: null,
    static_analysis: null,
    brief_compliance: null,
    coverage_analysis: null,
    recommendations: []
  };
  
  try {
    // 1. TDD Compliance Check
    results.tdd_compliance = await enforce_tdd_workflow({ sourceFile, testFile, requirementDescription: requirements });
    
    // 2. Static Analysis
    results.static_analysis = await run_static_analysis({ filePaths: [sourceFile] });
    
    // 3. Coverage Analysis
    if (testFile) {
      results.coverage_analysis = await analyze_test_coverage({ sourceFile, testFile });
    }
    
    // Determine overall pass/fail
    const tddPass = results.tdd_compliance?.success !== false;
    const staticPass = results.static_analysis?.errorCount === 0;
    const coveragePass = !testFile || (results.coverage_analysis?.percentage || 0) >= 80;
    
    results.overall_pass = tddPass && staticPass && coveragePass;
    
    // Generate recommendations
    if (!tddPass) results.recommendations.push('Fix TDD workflow violations');
    if (!staticPass) results.recommendations.push('Fix static analysis errors');
    if (!coveragePass) results.recommendations.push('Increase test coverage to 80% minimum');
    
    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
}

// Legacy QA tools for backward compatibility

export async function verify_requirements({ requirements, code }) {
  const { object } = await generateObject({
    model: getModelForTier('b_tier'),
    prompt: `Does the code satisfy all requirements? Respond with a boolean and feedback. Requirements: ${requirements}\n\nCode: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function verify_architecture({ architecture_blueprint, code }) {
  const { object } = await generateObject({
    model: getModelForTier('b_tier'),
    prompt: `Does the code adhere to the blueprint? Blueprint: ${architecture_blueprint}\n\nCode: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function run_tests_and_check_coverage({ test_command = "npm test -- --coverage", required_coverage = 80 }) {
  try {
    const { stdout } = await execPromise(test_command);
    const coverageRegex = /All files\s*\|\s*([\d.]+)/;
    const match = stdout.match(coverageRegex);
    const coverage = match ? parseFloat(match[1]) : 0;
    if (coverage >= required_coverage) {
      return { passed: true, feedback: `Tests passed with ${coverage}% coverage.` };
    }
    return { passed: false, feedback: `Coverage of ${coverage}% is below the required ${required_coverage}%.` };
  } catch (error) {
    return { passed: false, feedback: `Test execution failed: ${error.message}` };
  }
}
