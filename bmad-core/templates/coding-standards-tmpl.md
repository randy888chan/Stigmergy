# Project Coding Standards

[[LLM: This is a template. When generating for a new project, you MUST populate this into `docs/architecture/coding-standards.md`. Announce to the user that these are the default standards and can be modified directly in that file at any time.]]

This document defines the mandatory coding standards for this project. All AI agents (`@dev`, `@refactorer`) MUST adhere to these rules. The `@qa` agent WILL use these standards as the basis for its validation protocol. This document is part of the **Immutable Project Blueprint**.

## 1. Tooling & Formatting

- **Formatter:** Prettier is the single source of truth for all code formatting.
- **Configuration:** The Prettier configuration is defined in `.prettierrc` at the project root and MUST NOT be overridden.
- **Linting:** A linter (e.g., ESLint) will be used for identifying stylistic and programmatic errors. The configuration is in the project root (e.g., `.eslintrc.json`).
- **Pre-commit Hook:** A `pre-commit` hook (e.g., using Husky and lint-staged) MUST be configured to run the formatter and linter on all staged files. No code may be committed that does not pass these checks.

## 2. Naming Conventions

| Element Type                     | Convention       | Example                        |
| -------------------------------- | ---------------- | ------------------------------ |
| Variables, Functions             | `camelCase`      | `const userData = getUser();`   |
| Classes, Components (React/Vue)  | `PascalCase`     | `class UserProfile extends React.Component` |
| Constants (global, immutable)    | `UPPER_SNAKE_CASE` | `const MAX_RETRIES = 3;`       |
| Files (Components)               | `PascalCase.ext` | `UserProfile.tsx`              |
| Files (Utilities, Services)      | `camelCase.ext`  | `apiClient.ts`                 |
| API Endpoints (URL path)         | `kebab-case`     | `/api/user-profiles/{id}`      |

## 3. Code Structure & Best Practices

- **Imports:** Imports MUST be grouped and ordered as follows, separated by a blank line:
    1. External/library dependencies (e.g., `react`, `axios`).
    2. Internal absolute imports from `src/` (e.g., `src/components/Button`).
    3. Internal relative imports (e.g., `./utils`).
- **Function Size:** Functions should adhere to the Single Responsibility Principle. As a guideline, no function should exceed 50 lines of code. Longer functions must be refactored.
- **Error Handling:** All asynchronous operations MUST be wrapped in `try...catch` blocks or use equivalent Promise `.catch()` handling. Errors MUST NOT be silenced. They must be logged and handled gracefully.
- **Immutability:** State should be treated as immutable. Avoid direct mutation of objects and arrays; use non-mutating methods (e.g., spread syntax, `.map`, `.filter`) instead.
- **Environment Variables:** Access environment variables through a dedicated configuration module. DO NOT use `process.env` directly in application logic.

## 4. Testing Standards

- **Unit Tests:** Every function and component MUST have a corresponding unit test file.
- **Coverage:** The minimum acceptable test coverage is **85%** for statements, branches, and functions. This will be enforced by the CI pipeline.
- **Test Pattern:** Tests must follow the Arrange-Act-Assert (AAA) pattern.
- **Mocks:** All external dependencies (APIs, databases, services) MUST be mocked in unit tests.

## 5. Security

- **No Hardcoded Secrets:** No API keys, passwords, or other secrets are permitted in the source code. Load them from environment variables via a configuration service.
- **Input Validation:** All data received from external sources (e.g., API request bodies, URL parameters) MUST be validated against a schema before being processed.
- **Console Logs:** `console.log` statements are forbidden in production code. Use a structured logger instead.
