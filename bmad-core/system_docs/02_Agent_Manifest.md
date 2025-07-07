# Stigmergy Agent Manifest

This document serves as the official list of all agents available to the Stigmergy system, categorized by their swarm archetype. This is a core part of the **System Constitution**.

## 1. The Chief Orchestrator
The single point of command and intelligence for the entire swarm.

- **`@stigmergy-master` (Saul):** The master brain. Interprets user goals and system state, directs the swarm, and manages the entire project lifecycle.

## 2. Planners (The Visionaries)
Agents dispatched by the Orchestrator to create the project's **Immutable Blueprint**.

- **`@pm` (John):** Product Manager. Creates the PRD.
- **`@architect` (Winston):** Solution Architect. Creates the technical architecture.
- **`@analyst` (Mary):** Business & Research Analyst. Provides market grounding for plans.

## 3. Executors (The Builders)
Agents dispatched to perform concrete, constructive tasks.

- **`@stigmergy-orchestrator` (Olivia):** Execution Coordinator. Manages the dev->qa->po loop for a single story, decomposing it into smaller tasks.
- **`@sm` (Bob):** Task Decomposer. Breaks down epics from the blueprint into stories.
- **`@dev` (James):** Full Stack Developer. Implements code for sub-tasks.
- **`@victor` (Victor):** Smart Contract Developer. A specialist for blockchain projects.
- **`@ux-expert` (Sally):** UX Expert. Designs user experience and interfaces.

## 4. Verifiers (The Guardians)
Agents dispatched to ensure all work complies with the Blueprint.

- **`@qa` (Quinn):** Quality Assurance Gatekeeper. Verifies code quality against the project's `qa-protocol.md`.
- **`@po` (Sarah):** Product Owner. Validates that completed artifacts meet the acceptance criteria of the story.

## 5. Adaptive Responders (The Immune System)
Specialist agents dispatched to handle failures and drive system improvement.

- **`@debugger` (Dexter):** Root Cause Analyst. Resolves issues logged in the state file.
- **`@refactorer` (Rocco):** Code Quality Specialist. Improves existing code without changing functionality.
- **`@meta` (Metis):** System Auditor. Analyzes swarm performance and proposes improvements to the `.stigmergy-core`.
