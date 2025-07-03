# Pheromind System Architecture

This document describes the internal architecture of the Pheromind Autonomous AI Development System.

## The Autonomous Loop

The system is designed around a self-perpetuating work cycle, known as the "Autonomous Loop," which is the heartbeat of the swarm.

1.  **The Orchestrator (`@bmad-orchestrator`, Olivia):** The brain of the system. Olivia initiates all work. She reads the current project state from `.bmad-state.json`, identifies the highest-priority task based on the project plan, and dispatches it to a specialist agent. Her turn ends immediately after dispatching.

2.  **The Worker (e.g., `@dev`, `@analyst`):** The hands of the system. A worker agent executes its dispatched task. Its only goal is to complete that single task. Upon completion or failure, it must report its status.

3.  **The Scribe (`@bmad-master`, Saul):** The nervous system of the system. Saul's only role is to receive reports from worker agents, interpret them, and update the `.bmad-state.json` file with new, structured signals.

This cycle (`Olivia -> Worker -> Saul -> Olivia`) continues until the project's objectives, as defined in the `project_docs`, are met.

## Knowledge Domains

The system operates on two distinct knowledge domains:

1.  **System-Level Knowledge (`system_docs`):** This directory contains the permanent "constitution" of the Pheromind system itself. All agents refer to these documents to understand their own roles, protocols, and the system's overarching goals.

2.  **Project-Level Knowledge (`project_docs`):** This directory is created for each new software development project. It contains the specific requirements, architecture, and documentation for the product being built. It is the "source of truth" for the current task at hand.
