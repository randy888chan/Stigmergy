# {{Project Name}} Architecture Document

[[LLM: You are the Architect agent, Winston. The default path for this file is `docs/architecture.md`.
1. Review the `docs/prd.md` thoroughly.
2. IMPORTANT: Follow LAW VI (Mandatory Tool Usage). Use research tools to validate technology choices and architectural patterns against modern best practices.
3. Guide the user through this template section by section. Your goal is to produce a LEAN, ACTIONABLE blueprint for the swarm.
4. After presenting each major section, apply the `advanced-elicitation` task to refine the content collaboratively.
]]

## 1. Introduction
[[LLM: State the purpose of this document clearly.]]
This document outlines the technical architecture for `{{Project Name}}`. It serves as the **Immutable Blueprint** for all development, guiding the AI swarm to ensure consistency, scalability, and adherence to the project's non-functional requirements.

---

## 2. High-Level Architecture
[[LLM: Provide a concise overview of the architectural vision.]]

### 2.1. Architectural Style
*e.g., A Serverless, event-driven architecture hosted on AWS, using a monolithic Next.js frontend and Lambda functions for the backend. This choice prioritizes low operational cost and scalability, as outlined in the PRD.*

### 2.2. High-Level Diagram
[[LLM: Create a simple C4-style or component diagram using Mermaid to visualize the main parts of the system and their interactions.]]```mermaid
graph TD
    User -- HTTPS --> FE[Frontend on S3/CloudFront]
    FE -- API Calls --> APIGW[API Gateway]
    APIGW -- Invokes --> AuthFn[Auth Lambda]
    APIGW -- Invokes --> CrudFn[CRUD Lambda]
    CrudFn -- Interacts --> DB[(DynamoDB)]
```

---

## 3. Technology Stack
[[LLM: This section is the definitive source of truth for technologies and versions. Validate choices with research.]]

| Category           | Technology         | Version     | Rationale                                       |
| :----------------- | :----------------- | :---------- | :---------------------------------------------- |
| **Language**       | TypeScript         | `5.x`       | Strong typing for reliable AI code generation.  |
| **Frontend**       | Next.js (React)    | `14.x`      | Performance, SEO, and integrated tooling.       |
| **Backend**        | Node.js            | `20.x`      | Consistent language with the frontend.          |
| **Database**       | PostgreSQL (RDS)   | `16.x`      | Relational integrity and scalability.           |
| **Infrastructure** | AWS via CDK        | `2.x`       | Infrastructure as Code for reproducibility.     |
| **Authentication** | AWS Cognito        | `N/A`       | Managed user pools and secure authentication.   |
| **Testing**        | Jest & Vitest      | `latest`    | Standard for unit and integration testing.      |

---

## 4. Project Structure
[[LLM: Provide a lean, conventional folder structure.]]
```plaintext
/
├── .ai/                  # AI state files (ignored)
├── .stigmergy-core/      # Stigmergy agent definitions
├── docs/                 # The Immutable Blueprint (this file, PRD, etc.)
├── infrastructure/       # Infrastructure as Code (CDK)
├── src/                  # Application source code
│   ├── components/       # Shared UI components
│   ├── pages/            # Next.js pages/routes
│   ├── services/         # Backend service logic (Lambdas)
│   └── lib/              # Shared libraries (API clients, utils)
├── tests/                # Test files
└── package.json
```

---

## 5. Foundational Artifacts
[[LLM: These two documents are critical and will be generated alongside this one.]]

- **`docs/architecture/coding-standards.md`**: Defines mandatory rules for code quality, formatting, and patterns. This is non-negotiable for all executor agents.
- **`docs/architecture/qa-protocol.md`**: Defines the exact, automated pipeline the `@qa` agent will use to verify all code submissions.

---

## 6. Handoff
[[LLM: Once user approves, run `architect-checklist` against this doc, present results, and conclude.]]

### Checklist Results Report
[[LLM: Populate with results from `architect-checklist`.]]

### Handoff to Saul
**To `@stigmergy-master`:** "The Architectural Blueprint for `{{Project Name}}` is complete and validated. You may now update the project status and proceed with dispatching the `@sm` agent to begin story decomposition."
```
