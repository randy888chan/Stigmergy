# Pheromind Agent Manifest

This document serves as the official list of all agents available to the Pheromind system, categorized by their swarm archetype. This is a core part of the **System Constitution**.

## 1. The Chief Orchestrator

The single point of command and intelligence for the entire swarm.

- **`@stigmergy-master` (Saul):** The master brain. Interprets user goals and system state, directs the swarm, and manages the entire project lifecycle.

## 2. Planners (The Visionaries)

Agents dispatched by the Orchestrator to create the project's **Immutable Blueprint** and **Project Manifest**.

- **`@analyst` (Mary):** Creates the foundational `project-brief.md`.
- **`@pm` (John):** Creates the PRD and the Master Project Manifest in `state.json`.
- **`@architect` (Winston):** Creates the technical architecture.
- **`@ux-expert` (Sally):** Designs user experience and interfaces.

## 3. Executors (The Builders)

Agents dispatched to perform concrete, constructive tasks.

- **`@stigmergy-orchestrator` (Olivia):** Execution Coordinator. Manages the dev->qa->po loop for a single story. A subordinate of Saul.
- **`@sm` (Bob):** Task Decomposer. Breaks down epics into stories.
- **`@dev` (James):** Full Stack Developer. Implements code for sub-tasks.
- **`@victor` (Victor):** Smart Contract Developer. A specialist for blockchain projects.
- **`@refactorer` (Rocco):** System Implementer. Applies code refactors and system self-improvements.

## 4. Verifiers (The Guardians)

Agents dispatched to ensure all work complies with the Blueprint.

- **`@qa` (Quinn):** Quality Assurance Gatekeeper. Verifies code quality against the project's `qa-protocol.md`.
- **`@po` (Sarah):** Product Owner. Validates that completed artifacts meet the acceptance criteria of the story.

## 5. Adaptive Responders (The Immune System)

Specialist agents dispatched to handle failures and drive system improvement.

- **`@debugger` (Dexter):** Root Cause Analyst. Resolves issues logged in the state file.
- **`@meta` (Metis):** System Auditor. Analyzes swarm performance and proposes improvements to the `.stigmergy-core`.
