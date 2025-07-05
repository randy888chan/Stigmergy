# Pheromind Project: Coding Standards

[[LLM: This is a template. When generating for a new project, populate this into `docs/architecture/coding-standards.md`. Announce to the user that these are the default standards and can be modified directly in that file at any time.]]

This document defines the mandatory coding standards for this project. All AI agents (`@dev`, `@refactorer`) MUST adhere to these rules. The `@qa` agent WILL use these standards as the basis for its validation protocol.

## 1. Tooling & Formatting

- **Formatter:** Prettier (`prettier`) is the single source of truth for all code formatting.
- **Configuration:** The Prettier configuration is defined in `.prettierrc` at the project root and MUST NOT be overridden.
- **Linting:** ESLint (`eslint`) will be used for identifying stylistic and programmatic errors. The configuration is in `.eslintrc.json`.
- **Pre-commit Hook:** A `pre-commit` hook (using Husky and lint-staged) MUST be configured to run `prettier --write` and `eslint --fix` on all staged files. No code may be committed that does not pass these checks.

## 2. Naming Conventions

- **Variables & Functions:** `camelCase`.
- **Classes & Components (React/Vue/etc.):** `PascalCase`.
- **Constants:** `UPPER_SNAKE_CASE`.
- **Files:**
    - Components: `PascalCase.jsx` or `PascalCase.tsx`.
    - Utilities/Services: `camelCase.js` or `camelCase.ts`.
    - Test Files: `*.test.ts` or `*.spec.ts`.
- **API Endpoints:** `kebab-case` (e.g., `/api/user-profiles`).

## 3. Code Structure

- **Imports:** Imports MUST be grouped and ordered as follows:
    1. External dependencies (e.g., `react`, `axios`).
    2. Internal absolute imports from `src/` (e.g., `src/components/Button`).
    3. Internal relative imports (e.g., `./utils`).
- **Function Size:** No function should exceed 50 lines of code. Longer functions must be refactored into smaller, single-purpose helpers.
- **Component Size:** No UI component should exceed 200 lines of code. Complex components must be decomposed.

## 4. Error Handling

- All asynchronous operations MUST be wrapped in `try...catch` blocks or use equivalent Promise `.catch()` handling.
- Errors MUST NOT be silenced (e.g., `catch (e) {}`). They must be logged to a central logging service and re-thrown or handled gracefully by returning a structured error response.
- Use a dedicated `ApiError` class for all API-related errors, containing a status code and a user-friendly message.

## 5. Testing Standards

- **Unit Tests:** Every function and component MUST have a corresponding unit test file.
- **Coverage:** The minimum acceptable test coverage is **85%** for statements, branches, and functions. This will be enforced by the CI pipeline.
- **Test Pattern:** Tests must follow the Arrange-Act-Assert (AAA) pattern.
- **Mocks:** All external dependencies (APIs, databases, services) MUST be mocked in unit tests.

## 6. Security

- **No Hardcoded Secrets:** No API keys, passwords, or other secrets are permitted in the source code. They must be loaded from environment variables via a configuration service.
- **Input Validation:** All data received from external sources (API requests, user input) MUST be validated using a schema library (e.g., Zod, Joi) before being processed.
- **Console Logs:** `console.log` statements are forbidden in production code. Use a structured logger instead.

These standards are non-negotiable and form the basis of our automated quality gates.
