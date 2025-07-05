# Pheromind Project: Quality Assurance (QA) Protocol

This document outlines the mandatory protocol for the `@qa` agent (Quinn) when validating code submitted by a developer agent.

## Protocol Objective

To programmatically verify that all code submissions meet the project's standards for quality, correctness, and security before being approved. This process MUST be objective and based on verifiable artifacts.

## The QA Validation Pipeline

Upon receiving a code submission for a completed story, the `@qa` agent MUST execute the following steps **IN ORDER**. If any step fails, the pipeline HALTS, and the submission is rejected with a detailed report referencing the specific failed check.

### Step 1: Code Standards Compliance Check

1.  **Load Standards:** Ingest the `docs/architecture/coding-standards.md` file.
2.  **Static Analysis:**
    *   Execute `prettier --check` on all changed files.
    *   Execute `eslint .` on the entire project.
3.  **Verification:** Parse the output of the tools.
    *   **PASS Condition:** Both commands exit with code `0`.
    *   **FAIL Condition:** Either command exits with a non-zero code or reports errors. The rejection report MUST include the full error output from the failed tool.

### Step 2: Test Execution & Coverage Verification

1.  **Execute Tests:** Run the project's full test suite (e.g., `npm test` or `jest --coverage`).
2.  **Verification:**
    *   **Test Results:** Parse the test runner's output to ensure all tests passed.
    *   **Coverage Threshold:** Parse the coverage report (e.g., `coverage/lcov-report/index.html` or JSON summary) and verify that all coverage categories (statements, branches, functions) meet or exceed the **85%** threshold defined in the coding standards.
3.  **Verification:**
    *   **PASS Condition:** All tests pass AND all coverage thresholds are met.
    *   **FAIL Condition:** Any test fails OR any coverage threshold is not met. The rejection report MUST include the names of failing tests and the generated coverage summary.

### Step 3: Dependency Security Audit

1.  **Execute Audit:** Run a dependency audit (e.g., `npm audit`).
2.  **Verification:** Parse the audit report.
    *   **PASS Condition:** The audit reports 0 `critical` or `high` vulnerabilities. `moderate` or `low` vulnerabilities may be flagged in the final report but do not cause a failure.
    *   **FAIL Condition:** The audit reports 1 or more `critical` or `high` vulnerabilities. The rejection report MUST include the `npm audit` output.

### Step 4: Final Decision

-   **If all steps above pass:** The code is approved. The QA agent will produce a report with the `system_signal: 'code_approved_by_qa'` and a summary of all check outputs (linter, tests, coverage, audit).
-   **If any step fails:** The code is rejected. The QA agent will produce a detailed report with the `system_signal: 'code_rejected_by_qa'`, specifying exactly which step failed and including the complete log output from the failing tool as evidence. This report is then sent back to the developer agent for remediation.
