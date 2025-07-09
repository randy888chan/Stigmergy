# Project Quality Assurance (QA) Protocol

[[LLM: This is a template. When generating for a new project, you MUST populate this into `docs/architecture/qa-protocol.md`. The `@qa` agent will reference this project-level file for its instructions. This document is part of the **Immutable Project Blueprint**.]]

This document outlines the mandatory, automated protocol for the `@qa` agent (Quinn) when validating code submitted by a developer agent for a sub-task.

## Protocol Objective

To programmatically verify that all code submissions meet the project's defined standards for quality, correctness, and security before being approved for the next step in the development cycle. This process MUST be objective and based on verifiable tool outputs.

## The QA Validation Pipeline

Upon receiving a code submission for a completed sub-task, the `@qa` agent MUST execute the following steps **IN ORDER**. If any step fails, the pipeline HALTS, and the submission is rejected with a detailed report referencing the specific failed check and its full log output.

### Step 1: Code Standards Compliance Check

1.  **Load Standards:** Ingest the `docs/architecture/coding-standards.md` file from this project.
2.  **Static Analysis:**
    - Execute the project's formatting check command (e.g., `npm run lint:check`).
    - Execute the project's linting command (e.g., `npm run lint`).
3.  **Verification:** Parse the output of the tools.
    - **PASS Condition:** Both commands exit with code `0`.
    - **FAIL Condition:** Either command exits with a non-zero code or reports errors. The rejection report MUST include the full error output from the failed tool.

### Step 2: Test Execution & Coverage Verification

1.  **Execute Tests:** Run the project's full test suite with coverage reporting (e.g., `npm test -- --coverage`).
2.  **Verification:**
    - **Test Results:** Parse the test runner's output to ensure all tests passed.
    - **Coverage Threshold:** Parse the coverage report and verify that all coverage categories meet or exceed the thresholds defined in `docs/architecture/coding-standards.md`.
3.  **PASS/FAIL Condition:**
    - **PASS:** All tests pass AND all coverage thresholds are met.
    - **FAIL:** Any test fails OR any coverage threshold is not met. The rejection report MUST include the names of failing tests and the generated coverage summary.

### Step 3: Dependency Security Audit

1.  **Execute Audit:** Run a dependency audit against known vulnerabilities (e.g., `npm audit --audit-level=high`).
2.  **Verification:** Parse the audit report.
    - **PASS Condition:** The audit reports 0 `critical` or `high` vulnerabilities.
    - **FAIL Condition:** The audit reports 1 or more `critical` or `high` vulnerabilities. The rejection report MUST include the `npm audit` output.

### Step 4: Final Decision

- **If all steps above pass:** The code for the sub-task is approved. The QA agent will produce a report with the `system_signal: 'STORY_QA_PASSED'`.
- **If any step fails:** The code is rejected. The QA agent will produce a detailed report with the `system_signal: 'FAILURE_DETECTED'`, specifying exactly which step failed and including the complete log output from the failing tool as evidence.
