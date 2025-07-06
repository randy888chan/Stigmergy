# Task: Document an Existing Project

## Purpose

To systematically analyze an existing codebase and generate a comprehensive set of architectural documents. This process grounds the AI swarm, providing it with the necessary context to make intelligent, consistent, and safe contributions to a "brownfield" project.

## Agent Role

This task is typically executed by the `@architect` or `@bmad-master` agent.

## Task Instructions

[[LLM: You are now an expert system analyst. Your goal is to reverse-engineer the architecture and conventions of an existing project and document them clearly for your fellow AI agents.]]

### 1. Initial Project Analysis & User Elicitation

[[LLM: Before writing any documentation, you MUST first understand the project.

1.  **Analyze Project Structure:** Scan the entire directory structure to identify the main folders (`src`, `tests`, `docs`, etc.) and understand the overall organization.
2.  **Identify Technology Stack:** Locate and parse `package.json`, `requirements.txt`, `pom.xml`, `composer.json`, etc., to identify the languages, frameworks, and key dependencies with their versions.
3.  **Find Configuration:** Look for build configurations (`webpack.config.js`, `vite.config.js`), CI/CD files (`.github/workflows/`), and project configurations (`.eslintrc`, `.prettierrc`, `tsconfig.json`).
4.  **Engage the User:** Announce your initial findings and ask clarifying questions to fill in the gaps. For example:
    *   "I've identified this is a Next.js project using TypeScript and Tailwind CSS. Is this correct?"
    *   "What is the primary purpose of this application?"
    *   "Are there any particularly complex or important areas of the codebase I should focus on?"
    *   "What database is this project connected to, and where can I find the schema definition or models?"
]]

### 2. Generate Core Architectural Documents

[[LLM: Based on your analysis and user feedback, generate the following core documents in the `docs/architecture/` directory. Create each document section-by-section, using the `advanced-elicitation` task to refine the content with the user.]]

**Core Documents to Generate:**

1.  `docs/architecture/tech-stack.md`
2.  `docs/architecture/unified-project-structure.md`
3.  `docs/architecture/coding-standards.md`
4.  `docs/architecture/testing-strategy.md`
5.  `docs/architecture/rest-api-spec.md` (if applicable)
6.  `docs/architecture/data-models.md` (if applicable)
7.  `docs/architecture/deployment-guide.md`

### 3. Document Structure and Content Guidelines

[[LLM: Use the following structure for each document to ensure consistency and clarity for AI agents.]]

#### `tech-stack.md`
- **Purpose:** Provide a definitive list of all technologies used.
- **Content:** Create a markdown table with columns for `Category`, `Technology`, `Version`, and `Purpose`. Populate it with data from `package.json` and other dependency files.

#### `unified-project-structure.md`
- **Purpose:** Explain the "why" behind the folder structure.
- **Content:** Use an ASCII tree diagram to represent the directory structure. For each key folder, provide a brief explanation of its role (e.g., `src/lib` - "Shared utilities and services").

#### `coding-standards.md`
- **Purpose:** Codify the project's implicit conventions.
- **Content:** Analyze existing code to deduce naming conventions (e.g., `camelCase` for functions), file naming patterns, and formatting rules (from `.prettierrc`). Document these as explicit rules.

#### `testing-strategy.md`
- **Purpose:** Define how testing is done in the project.
- **Content:** Identify the testing frameworks used (`jest`, `cypress`, etc.). Document the location of test files and the command to run the test suite.

#### `rest-api-spec.md`
- **Purpose:** Document all existing API endpoints.
- **Content:** Analyze the API routes/controllers in the code to create an OpenAPI 3.0 specification in YAML format. For each endpoint, document the method, path, request/response bodies, and authentication requirements.

#### `data-models.md`
- **Purpose:** Define the core data structures of the application.
- **Content:** Analyze the database models or ORM schemas (`prisma/schema.prisma`, Mongoose models, etc.) to define the key data entities, their attributes, types, and relationships.

#### `deployment-guide.md`
- **Purpose:** Explain how the project is built and deployed.
- **Content:** Analyze `package.json` scripts and CI/CD files to document the build command, output directory, and the steps required to deploy the application.

### 4. Final Handoff

- **Action:** Once all documents are generated and validated with the user, update the `.ai/state.json` file.
- **State Change:** Set `project_status` to `READY_FOR_EXECUTION` and `system_signal` to `BLUEPRINT_COMPLETE`.
- **Report:** Conclude with a summary report to `@bmad-master`: "Project documentation complete. The existing codebase has been analyzed, and a full architectural blueprint has been generated in `docs/`. The system is now grounded and ready for new development tasks."
