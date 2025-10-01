// Enhanced QA Tools for Stigmergy with TDD Enforcement and Static Analysis
import * as fs from 'fs-extra';
import path from 'path';
import { generateObject as defaultGenerateObject } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const defaultExecPromise = promisify(exec);

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
export async function analyze_test_coverage({ sourceFile, testFile, execPromise = defaultExecPromise }) {
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
 * Run dependency vulnerability scan using npm audit
 */
export async function run_dependency_audit({ auditLevel = 'high', execPromise = defaultExecPromise }) {
  console.log('[QA] Running dependency vulnerability scan...');
  
  try {
    const auditCommand = `npm audit --audit-level=${auditLevel} --json`;
    
    const result = await execPromise(auditCommand, {
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout
    });
    
    // If we get here, the audit passed (no vulnerabilities found at specified level)
    return {
      success: true,
      vulnerabilities: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      message: `No vulnerabilities found at ${auditLevel} level or above`
    };
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    if (error.stdout) {
      try {
        const auditReport = JSON.parse(error.stdout);
        
        // Count vulnerabilities by severity
        let critical = 0, high = 0, moderate = 0, low = 0;
        
        if (auditReport.metadata && auditReport.metadata.vulnerabilities) {
          const vulns = auditReport.metadata.vulnerabilities;
          critical = vulns.critical || 0;
          high = vulns.high || 0;
          moderate = vulns.moderate || 0;
          low = vulns.low || 0;
        }
        
        const totalVulns = critical + high + moderate + low;
        
        // Determine if this should be considered a failure based on audit level
        let isFailure = false;
        let failureMessage = '';
        
        if (auditLevel === 'critical' && critical > 0) {
          isFailure = true;
          failureMessage = `${critical} critical vulnerabilities found`;
        } else if (auditLevel === 'high' && (critical > 0 || high > 0)) {
          isFailure = true;
          failureMessage = `${critical} critical and ${high} high vulnerabilities found`;
        } else if (auditLevel === 'moderate' && (critical > 0 || high > 0 || moderate > 0)) {
          isFailure = true;
          failureMessage = `${critical} critical, ${high} high, and ${moderate} moderate vulnerabilities found`;
        }
        
        return {
          success: !isFailure,
          vulnerabilities: totalVulns,
          critical,
          high,
          moderate,
          low,
          message: isFailure ? 
            `VULNERABILITY SCAN FAILED: ${failureMessage}` : 
            `Found ${totalVulns} vulnerabilities (${critical} critical, ${high} high, ${moderate} moderate, ${low} low) - below ${auditLevel} threshold`,
          details: auditReport
        };
      } catch (parseError) {
        // If we can't parse the JSON, return the raw error
        return {
          success: false,
          error: `Failed to parse npm audit output: ${parseError.message}`,
          raw_output: error.stdout
        };
      }
    }
    
    // Some other error occurred
    return {
      success: false,
      error: error.message,
      vulnerabilities: 0
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
    dependency_audit: null,
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
    
    // 4. Dependency Vulnerability Scan
    results.dependency_audit = await run_dependency_audit({ auditLevel: 'high' });
    
    // Determine overall pass/fail
    const tddPass = results.tdd_compliance?.success !== false;
    const staticPass = results.static_analysis?.errorCount === 0;
    const coveragePass = !testFile || (results.coverage_analysis?.percentage || 0) >= 80;
    const auditPass = results.dependency_audit?.success !== false;
    
    results.overall_pass = tddPass && staticPass && coveragePass && auditPass;
    
    // Generate recommendations
    if (!tddPass) results.recommendations.push('Fix TDD workflow violations');
    if (!staticPass) results.recommendations.push('Fix static analysis errors');
    if (!coveragePass) results.recommendations.push('Increase test coverage to 80% minimum');
    if (!auditPass) results.recommendations.push('Fix dependency vulnerabilities');
    
    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
}

// Legacy QA tools for backward compatibility

export async function verify_requirements({ requirements, code, ai, generateObject = defaultGenerateObject, config }) {
  const { client, modelName } = ai.getModelForTier('b_tier', null, config);
  const { object } = await generateObject({
    model: client(modelName),
    prompt: `Does the code satisfy all requirements? Respond with a boolean and feedback. Requirements: ${requirements}

Code: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function verify_architecture({ architecture_blueprint, code, ai, generateObject = defaultGenerateObject, config }) {
  const { client, modelName } = ai.getModelForTier('b_tier', null, config);
  const { object } = await generateObject({
    model: client(modelName),
    prompt: `Does the code adhere to the blueprint? Blueprint: ${architecture_blueprint}

Code: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function run_tests_and_check_coverage({ test_command = "npm test -- --coverage", required_coverage = 80, execPromise = defaultExecPromise }) {
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
