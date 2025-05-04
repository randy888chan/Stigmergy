# Testing Strategy: WasaPrecruit MVP

This document outlines the testing strategy for the WasaPrecruit MVP to ensure quality, reliability, and correctness.

## Goals

*   Verify functional requirements are met.
*   Ensure system stability and performance under expected load.
*   Catch regressions before they reach production.
*   Build confidence in deployments.
*   Facilitate safe refactoring and modifications (by humans and AI).

## Testing Levels

We will employ a multi-layered testing approach:

1.  **Static Analysis (Linting/Formatting):**
    *   **Tools:** ESLint, Prettier, TypeScript Compiler.
    *   **Scope:** Enforce code style, detect syntax errors, enforce type safety.
    *   **Execution:** Run automatically on commit hooks and in CI pipeline.
    *   **Rationale:** Catches basic errors early and enforces consistency.

2.  **Unit Tests:**
    *   **Tools:** Jest or Vitest (for both Frontend and Backend Node.js/TS code).
    *   **Scope:** Test individual functions, modules, components, and classes in isolation. Focus on business logic, utility functions, and pure UI components.
    *   **Execution:** Run locally during development and in CI pipeline on every push/PR.
    *   **Mocking:** Use Jest/Vitest mocking capabilities to isolate units from external dependencies (APIs, databases, cloud services).
    *   **Target Coverage:** Aim for high coverage (>80%) of critical business logic.
    *   **Rationale:** Fast feedback loop, verifies correctness of small units, enables safe refactoring.

3.  **Integration Tests:**
    *   **Tools:** Jest/Vitest, potentially with libraries like `supertest` (for HTTP endpoints) or tools to interact with deployed AWS resources (e.g., AWS SDK).
    *   **Scope:** Test interactions between different components or services. Examples:
        *   API endpoint handler correctly interacting with the database (using a test database or mocking the DB layer).
        *   Message processing flow (e.g., WhatsApp Ingestor -> SQS -> Backend API Lambda).
        *   Frontend component fetching data from the backend API (mocking the API).
    *   **Execution:** Run in CI pipeline, potentially less frequently than unit tests due to longer execution time.
    *   **Rationale:** Verifies collaboration between units and integration points.

4.  **End-to-End (E2E) Tests:**
    *   **Tools:** Playwright or Cypress.
    *   **Scope:** Simulate real user scenarios by interacting with the live application (Frontend UI) through a browser. Examples:
        *   Recruiter logs in, receives a message, views aspirant data, sends a reply.
        *   Verify real-time message updates in the UI.
    *   **Environment:** Run against a dedicated test/staging environment that mirrors production closely.
    *   **Execution:** Run in CI pipeline, likely triggered less frequently (e.g., before production deployments) due to complexity and duration.
    *   **Rationale:** Provides highest confidence that user flows work as expected across the entire stack.

5.  **Manual / Exploratory Testing:**
    *   **Scope:** Unscripted testing performed by humans to uncover usability issues, edge cases, or unexpected behavior not covered by automated tests.
    *   **Execution:** Performed periodically, especially before major releases or after significant changes.
    *   **Rationale:** Catches issues that automated tests might miss, provides qualitative feedback.

## Testing Specific Areas

*   **Frontend (React UI):**
    *   Unit tests for components (logic & rendering, using React Testing Library).
    *   Unit tests for hooks and state management stores.
    *   Integration tests for data fetching.
    *   E2E tests for user flows.
*   **Backend (Lambda Functions):**
    *   Unit tests for handlers and business logic (mocking AWS SDKs, DB interactions).
    *   Integration tests for API endpoints/resolvers (using local mocks or testing against deployed dev/staging resources).
*   **AI Bot Logic:**
    *   Unit tests for the state machine/flow logic.
    *   Integration tests verifying interaction with the WhatsApp sending mechanism.
*   **Infrastructure (IaC):**
    *   Linting and validation of CDK/Terraform code.
    *   Testing deployed infrastructure (e.g., checking resource creation, basic connectivity) can be part of integration/E2E tests or specific infrastructure tests.

## CI/CD Integration

*   The CI/CD pipeline (e.g., GitHub Actions) will automate the execution of static analysis, unit tests, and integration tests on every pull request and push to main branches.
*   E2E tests might run on merges to staging or before production deployment triggers.
*   Builds/deployments should fail if tests do not pass.

## Quality Gates

*   **Pull Requests:** Require passing static analysis and unit/integration tests before merging.
*   **Staging Deployment:** Require passing E2E tests before promoting to production.
*   **Code Coverage:** Monitor code coverage trends, aiming for a baseline (e.g., 70-80% for unit tests on critical code) but focusing on testing quality over raw numbers.

## Specialized Testing Types (Add sections as needed)

### Performance Testing

- **Scope & Goals:** {What needs performance testing? What are the targets (latency, throughput)?}
- **Tools:** {e.g., K6, JMeter, Locust}

### Security Testing

- **Scope & Goals:** {e.g., Dependency scanning, SAST, DAST, penetration testing requirements.}
- **Tools:** {e.g., Snyk, OWASP ZAP, Dependabot}

### Accessibility Testing (UI)

- **Scope & Goals:** {Target WCAG level, key areas.}
- **Tools:** {e.g., Axe, Lighthouse, manual checks}

### Visual Regression Testing (UI)

- **Scope & Goals:** {Prevent unintended visual changes.}
- **Tools:** {e.g., Percy, Applitools Eyes, Playwright visual comparisons}

## Test Data Management

{How is test data generated, managed, and reset for different testing levels?}

## Change Log

| Change        | Date       | Version | Description   | Author         |
| ------------- | ---------- | ------- | ------------- | -------------- |
| Initial draft | YYYY-MM-DD | 0.1     | Initial draft | {Agent/Person} |
| ...           | ...        | ...     | ...           | ...            |
