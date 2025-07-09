# Pheromind System Architecture & Operations Manual

This document describes the high-level architecture and immutable operational rules of the Pheromind Autonomous AI Development System. This is a core part of the **System Constitution**.

## Core Concept: The State-Driven Loop

The system operates on a single, continuous work cycle driven by the **Chief Strategist (`@saul`)**. This cycle is not a rigid script but a dynamic loop that reacts to "digital pheromones"—the system's shared state.

The **`.ai/state.json`** file is the central nervous system of the swarm. It is the sole source of truth for project status and agent coordination.

## The Pheromind Cycle: A Unified Workflow

1.  **State Interpretation (Saul):**

    - **Input:** At the start of every cycle, Saul's first action is to read `.ai/state.json`.
    - **Action:** He acts as the **System Interpreter**, deciding the single most important next step based on his constitutional logic and the Agent Manifest.

2.  **Strategic Dispatch (Saul):**

    - **Action:** Based on his interpretation, Saul acts as the **Chief Orchestrator**, dispatching one specialist agent to perform a specific task. He then enters a waiting state.

3.  **Specialized Execution & Verification (The Swarm):**
    - **Input:** A specialist agent receives a direct command.
    - **Action:** The agent performs its narrowly defined task (e.g., `@john` creates the manifest; `@olivia` manages a story's execution).
    - **Verification:** An Executor's work is followed by a Verifier's programmatic check (`@quinn` runs tests).
    - **Output:** Upon task completion, the agent's final act is to report back to Saul by leaving a new `system_signal` in the `state.json` file. This "pheromone" is the trigger for Saul's next interpretation cycle.
