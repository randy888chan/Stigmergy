# Coding Standards: WasaPrecruit MVP

This document outlines the coding standards and best practices for the WasaPrecruit MVP project. Adhering to these standards ensures code consistency, readability, maintainability, and facilitates collaboration, especially with AI-driven development.

**Core Principles:**

*   **Readability:** Code should be easy to understand.
*   **Consistency:** Apply standards uniformly across the codebase.
*   **Simplicity:** Prefer clear, straightforward solutions (KISS).
*   **Maintainability:** Write code that is easy to modify and debug.
*   **Agent-Friendliness:** Practices that make code easier for AI agents to parse, understand, and modify safely.

## 1. Language: TypeScript

*   **Strict Mode:** Enable `strict` mode in `tsconfig.json` for maximum type safety.
*   **Typing:**
    *   Use explicit types for function parameters, return values, and variable declarations where type inference is not obvious.
    *   Prefer interfaces (`interface`) for defining object shapes and type aliases (`type`) for primitives, unions, intersections.
    *   Avoid `any` type. Use `unknown` when the type is truly unknown and perform type checks.
    *   Utilize utility types (e.g., `Partial`, `Readonly`, `Pick`) where appropriate.
    *   Leverage `packages/common-types` for shared data structures between frontend and backend.
*   **Features:** Use modern TypeScript features (optional chaining `?.`, nullish coalescing `??`, async/await) where appropriate.

## 2. Code Formatting

*   **Tool:** Prettier
    *   *Rationale:* Enforces consistent formatting automatically.
*   **Configuration:** Use the shared `.prettierrc.js` configuration file in the project root.
*   **Integration:** Configure IDEs to format on save. Include a formatting check in the CI pipeline.

## 3. Linting

*   **Tool:** ESLint
    *   *Rationale:* Identifies problematic patterns and enforces code style rules beyond formatting.
*   **Configuration:** Use the shared `.eslintrc.js` configuration file, extending recommended rule sets (e.g., `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`).
*   **Integration:** IDE integration for real-time feedback. Include linting checks in the CI pipeline.

## 4. Naming Conventions

*   **General:** Use descriptive and meaningful names.
*   **Variables & Functions:** `camelCase` (e.g., `aspirantProfile`, `sendMessage`).
*   **Classes & Interfaces:** `PascalCase` (e.g., `AspirantService`, `MessageData`).
*   **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_MESSAGE_LENGTH`).
*   **Files:** `kebab-case` (e.g., `aspirant-profile.tsx`) or `PascalCase` for React components (`AspirantProfile.tsx`). Be consistent within `ui/` and `services/`.
*   **Booleans:** Prefix with `is`, `has`, `should` (e.g., `isSubmitted`, `hasKids`).
*   **Handlers:** Often end with `Handler` (e.g., `webhookHandler`, `sendMessageHandler`).

## 5. Commenting & Documentation (Agent Friendliness Focus)

*   **Philosophy:** Code should be self-documenting where possible, but comments are crucial for explaining *why*, not *what*.
*   **TSDoc/JSDoc:** **MANDATORY** for all exported functions, classes, interfaces, and complex logic blocks.
    *   Use TSDoc (`/** ... */`) for detailed explanations.
    *   Include `@param`, `@returns`, `@throws` tags.
    *   Describe the *purpose* and *usage* clearly.
    *   **Rationale:** Provides structured information essential for AI agents to understand function signatures, purpose, and side effects.
*   **Inline Comments (`//`):** Use sparingly for clarifying non-obvious code snippets or complex algorithms.
*   **TODO Comments:** Use `// TODO:` or `// FIXME:` with a description and optionally your name/ticket ID.

## 6. Modularity & File Structure (Agent Friendliness Focus)

*   **Single Responsibility Principle (SRP):** Each function, class, and module should have one primary responsibility.
    *   **Rationale:** Smaller, focused units are easier to understand, test, refactor, and for AI agents to modify correctly.
*   **File Size:** Keep files reasonably small. If a file becomes too large (e.g., > 300-400 lines), consider refactoring and splitting it.
    *   **Rationale:** Reduces cognitive load for humans and complexity for AI analysis.
*   **Directory Structure:** Follow the structure defined in `docs/project-structure.md`.
*   **Index Files (`index.ts`):** Use `index.ts` files to re-export modules from a directory, simplifying imports, but avoid putting logic in them.

## 7. Error Handling

*   **Explicit Handling:** Use `try...catch` blocks for operations that can fail (API calls, I/O).
*   **Custom Errors:** Define custom error classes for specific failure scenarios if needed (e.g., `AspirantNotFoundError`).
*   **Logging:** Log errors with sufficient context (e.g., function name, relevant IDs). Use structured logging (JSON) in backend services.
*   **Fail Fast:** Avoid swallowing errors silently. Let errors propagate unless specifically handled.
*   **API Responses:** Return appropriate HTTP status codes and error messages from API endpoints.

## 8. Asynchronous Code

*   **Prefer `async/await`:** Use `async/await` over raw Promises or callbacks for cleaner asynchronous code.
*   **Error Handling:** Use `try...catch` around `await` calls.
*   **Concurrency:** Use `Promise.all` or `Promise.allSettled` for handling multiple promises concurrently when appropriate.

## 9. Testing

*   **Strategy:** Refer to `docs/testing-strategy.md`.
*   **Unit Tests:** Write unit tests for individual functions and modules, especially business logic.
*   **Integration Tests:** Test interactions between components (e.g., API endpoint hitting the database).
*   **Tooling:** Jest (or Vitest) for unit/integration tests.

## 10. Security

*   **Input Validation:** Validate and sanitize all external input (API requests, webhook payloads).
*   **Secrets Management:** Never commit secrets directly to the repository. Use environment variables and services like AWS Secrets Manager (see `docs/environment-vars.md`).
*   **Dependencies:** Keep dependencies updated to patch security vulnerabilities (use `npm audit` / `yarn audit`).

## 11. Git & Version Control

*   **Branching:** Use a standard branching model (e.g., Gitflow or GitHub Flow).
*   **Commit Messages:** Write clear, concise commit messages following Conventional Commits format (https://www.conventionalcommits.org/).
    *   **Rationale:** Facilitates automated changelog generation and semantic versioning.
*   **Pull Requests:** Use Pull Requests for code reviews before merging to main branches.
