# Pheromind AI Agent System Guidelines (AGENTS.md)

This document provides high-level guidelines and principles for developers and users interacting with the Pheromind AI Agent System. For detailed setup and operational workflows, please refer to `docs/pheromind-v2-manual-setup-and-workflow.md`.

## Core Philosophy: Swarm Intelligence & Stigmergy

The Pheromind system is built upon the principles of **Swarm Intelligence**, where multiple specialized AI agents collaborate to achieve complex goals. This collaboration is primarily achieved through **Stigmergy** – indirect communication by observing and modifying a shared environment.

In Pheromind V2, this shared environment is centrally managed by:

1.  **`.bmad-state.json`**: This file is the "digital pheromone trail" or the collective memory of the swarm. It contains:
    *   `swarmConfig`: Defines the rules, signal types, priorities, and categories that govern agent interactions.
    *   `signals`: A list of timestamped events, needs, problems, or state changes reported by agents.
    *   `project_documents`: A map tracking key project artifacts and their locations.
2.  **Saul (Scribe Agent - `bmad-master`)**: Saul is the *sole writer* to `.bmad-state.json`. Other agents report their findings and actions to Saul in natural language, and Saul translates these into structured signals.
3.  **Olivia (Orchestrator Agent - `bmad-orchestrator`)**: Olivia is your primary interface to the system. She reads `.bmad-state.json` (including `swarmConfig` and `signals`) to understand the current project status, prioritize tasks, and dispatch work to specialized agents. She operates autonomously based on this shared state.

## Key Interaction Principles

*   **Primary Interaction via Olivia**: For most tasks, users should interact with Olivia. She is designed to understand your high-level goals, coordinate the necessary agents, and manage the workflow.
*   **Agent Autonomy**: Once a task is dispatched, agents (including Olivia managing sequences) will attempt to complete their objectives autonomously, reporting progress and issues back to Saul.
*   **State-Driven Decisions**: The system's behavior is driven by the signals in `.bmad-state.json`. Olivia uses this information to decide what to do next.

## Guidelines for All Agents (Current and Future Development)

These guidelines ensure effective collaboration and AI-verifiable outcomes:

1.  **Clear Reporting to Saul**:
    *   Upon completing a task, failing a task, or identifying a need (e.g., for research), an agent MUST formulate a clear, natural language report intended for Saul.
    *   This report is the basis for Saul to generate accurate signals.

2.  **Explicit Artifact Tracking (AI-Verifiable Methodology)**:
    *   When an agent's task involves creating or modifying a file (code, documentation, test results, etc.), its report to Saul MUST explicitly include:
        *   The **full, unambiguous path** to the created or modified artifact.
        *   A **clear status** of the artifact (e.g., `created`, `updated`, `deleted`, `tests_passed_for_artifact`, `tests_failed_for_artifact`, `analysis_complete_for_artifact`).
    *   Saul will use this information to update the `project_documents` map and generate relevant signals in `.bmad-state.json`, making the existence and status of artifacts AI-verifiable.

3.  **Adherence to `customInstructions`**:
    *   Each agent operates based on its YAML configuration found within its `customInstructions` (as seen in `.roomodes` or the agent's `.md` file). These instructions define its persona, core principles, commands, and dependencies.
    *   Deviating from these instructions can lead to unpredictable behavior.

4.  **Dependency Management**:
    *   Agents should primarily rely on their explicitly listed `dependencies` (tasks, templates, data files) for their operations.
    *   If an agent requires information not listed or available, it should typically report this as a need (e.g., `research_query_pending`) via Saul, allowing Olivia to coordinate.

5.  **Contextual Awareness through `ph/Prompt Engineering_v7.pdf`**:
    *   While this `AGENTS.md` provides general guidelines, the principles outlined in `ph/Prompt Engineering_v7.pdf` (Role, Context, Instruction, Output Format) are foundational to how each agent is designed and should be considered when extending the system or developing new agents. The existing agent configurations aim to embody these principles.

## Using the System

1.  **Setup**: Follow the instructions in `docs/pheromind-v2-manual-setup-and-workflow.md` to configure your environment (e.g., Roo Code with the `.roomodes` file).
2.  **Initiate Work**: Typically, you will start by giving a high-level goal or a "Zero-Code User Blueprint" to Olivia.
3.  **Monitor and Assist**: Observe the `.bmad-state.json` (if needed, though Olivia can provide summaries) and respond to any clarification or research requests that Olivia presents to you.

By adhering to these guidelines, the Pheromind AI Agent System can operate more effectively, autonomously, and produce verifiable results, aligning with the overall AI Coding System Goal.
