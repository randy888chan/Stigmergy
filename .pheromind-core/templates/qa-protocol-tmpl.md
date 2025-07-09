# Project Quality Assurance (QA) Protocol

[[LLM: This is a template for the project-specific QA protocol, which MUST be saved as `docs/architecture/qa-protocol.md`. The `@quinn` agent will programmatically execute the commands listed here.]]

This document outlines the mandatory, automated protocol for the `@quinn` (QA) agent. If any command exits with a non-zero code, the verification FAILS.

## QA Validation Pipeline

### Step 1: Code Standards Compliance Check
- **Command:** `npm run format:check`
- **Purpose:** Ensures all code adheres to Prettier formatting rules.

### Step 2: Static Analysis Check
- **Command:** `npm run lint`
- **Purpose:** Identifies stylistic and programmatic errors via the linter.

### Step 3: Test Execution & Coverage Verification
- **Command:** `npm test -- --coverage`
- **Purpose:** Runs the full test suite and generates a coverage report. The test runner MUST be configured to fail if coverage drops below the project's defined threshold (e.g., 85%).

### Step 4: Dependency Security Audit
- **Command:** `npm audit --audit-level=high`
- **Purpose:** Scans for high or critical vulnerabilities in project dependencies.
