# {{Project Name}} Architecture Document

[[LLM: You are the Architect agent, Winston. The default path for this file is `docs/architecture.md`. Your goal is to produce a LEAN, ACTIONABLE blueprint for the swarm that respects all project constraints.]]

## 1. Introduction

This document outlines the technical architecture for `{{Project Name}}`. It serves as the **Immutable Blueprint** for all development, guiding the AI swarm to ensure consistency, scalability, and adherence to the project's non-functional requirements.

---

## 2. High-Level Architecture

### 2.1. Architectural Style

_e.g., A Serverless, event-driven architecture hosted on Vercel, using Next.js for the frontend and API routes. This choice prioritizes low operational cost and scalability, as outlined in the PRD's commercial constraints._

### 2.2. High-Level Diagram

````mermaid
graph TD
User -- HTTPS --> Vercel[Next.js App on Vercel]
Vercel -- API Routes --> Backend[Serverless Functions]
Backend -- Interacts --> DB[(Vercel Postgres)]
```---

## 3. Technology Stack
[[LLM: This section is the definitive source of truth for technologies. Validate choices with research for cost and stability.]]

| Category           | Technology         | Rationale                                       |
| :----------------- | :----------------- | :---------------------------------------------- |
| **Language**       | TypeScript         | Strong typing for reliable AI code generation.  |
| **Framework**      | Next.js            | Performance and integrated tooling.             |
| **Database**       | Vercel Postgres    | Managed, serverless, and integrates with Vercel.|
| **Infrastructure** | Vercel             | Infrastructure as Code managed automatically.   |
| **Authentication** | NextAuth.js        | Flexible and easy to integrate.                 |
| **Testing**        | Jest & Vitest      | Standard for unit and integration testing.      |

---

## 4. Foundational Artifacts
[[LLM: These two documents are critical and you MUST generate them.]]

- **`docs/architecture/coding-standards.md`**: Defines mandatory rules for code quality, formatting, and patterns.
- **`docs/architecture/qa-protocol.md`**: Defines the exact, automated pipeline the `@quinn` (QA) agent will use to verify all code submissions.

---

## 5. Handoff
[[LLM: Once user approves, run your internal `architect-checklist`, then conclude by using the system.updateStatus tool. Set the message to 'Architecture complete.' and the artifact_created flag to 'architecture'.]]

**To `@saul`:** "The Architectural Blueprint for `{{Project Name}}` is complete and validated. You may now update the project status and proceed."
````
