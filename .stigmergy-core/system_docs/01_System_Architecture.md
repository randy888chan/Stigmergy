# Stigmergy System Architecture & Operations Manual (v1.0)

This document describes the high-level architecture and operational rules of the Stigmergy Autonomous AI Development System. This is a core part of the **System Constitution**.

## Core Concept: Uninterruptible, State-Driven Phases

The system operates on a single, continuous work cycle driven by the project's state (`.ai/state.json`). This cycle is not a rigid script but a dynamic state machine that progresses through five distinct, largely uninterruptible phases.

1.  **Phase I: The Grand Blueprint (Fully Autonomous)**
    *   **Trigger:** The user issues a single `start project` command via chat.
    *   **Process:** A chain of specialized Planner agents is dispatched to create a complete project plan. This includes the Brief, PRD, Architecture, a machine-readable `execution-blueprint.yml`, and a story file for every single task. During this phase, the system also indexes the project's existing code into its Neo4j knowledge graph.
    *   **User Interaction:** None.

2.  **Phase II: The Go/No-Go Decision (Single User Interaction)**
    *   **Trigger:** The "Grand Blueprint" is complete.
    *   **Process:** The system halts and notifies the user that the entire plan is ready for a final review and approval.
    *   **User Interaction:** One natural language command to approve execution.

3.  **Phase III: Autonomous Execution (Fully Autonomous)**
    *   **Trigger:** The user grants approval.
    *   **Process:** The engine begins executing the blueprint task by task. Executor agents leverage the Neo4j CodeRAG to automatically pull in context about the code they are modifying, dramatically improving accuracy.
    *   **User Interaction:** None.

4.  **Phase IV: Deployment & Finalization (Minimal User Interaction)**
    *   **Trigger:** All coding tasks are complete.
    *   **Process:** The system runs final deployment and testing scripts.
    *   **User Interaction:** The system will pause and request any required secrets (API keys, wallet keys) in a single batch.

5.  **Phase V: Self-Improvement (Fully Autonomous)**
    *   **Trigger:** The project is marked as complete.
    *   **Process:** The `@metis` agent analyzes the entire project history to find inefficiencies and propose improvements for *future* projects, which are saved for human review. This respects the immutability of the just-completed plan.
    *   **User Interaction:** None.

## Tooling & IDE Integration (MCPs)

Stigmergy supports a hybrid tooling model. Agents can either use their internal, engine-native tools (e.g., `web.search` making an API call) or they can delegate tool execution to the user's IDE via an `IDE_COMMAND`. This allows Stigmergy to leverage the user's existing, pre-configured extensions like Brave Search or Firecrawl MCPs for a more seamless and powerful experience.
