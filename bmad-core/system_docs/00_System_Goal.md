# Pheromind System Architecture

This document describes the internal architecture of the Pheromind Autonomous AI Development System.

## The Autonomous Loop

The system operates on a self-perpetuating work cycle, the "Autonomous Loop," driven by a shared state file. This loop is the heartbeat of the swarm and continues until the project goals are met.

**Shared State File:** The central medium for agent communication is `.ai/state.json`. Agents do not communicate directly; they interact by modifying this file, leaving signals for others to act upon (a process called stigmergy).

The loop proceeds in three distinct steps:

**1. Orchestration (`@bmad-orchestrator`, Olivia):**
*   **Input:** Reads the `.ai/state.json` file.
*   **Action:** Analyzes the `project_status` and `system_signals` to determine the next highest-priority task. Dispatches the task to the appropriate specialist worker agent (e.g., `@sm` to create a story, `@dev` to implement it).
*   **Output:** Her turn ends immediately after dispatching the worker. She does not perform tasks herself.

**2. Execution (Worker Agent, e.g., `@dev`):**
*   **Input:** Receives a specific task from the Orchestrator.
*   **Action:** Executes the single task using its specialized skills and tools. It MUST consult the project's "Blueprint" (`docs/`) and adhere to the system's "Constitution" (`bmad-core/system_docs/`).
*   **Output:** Upon completion or failure, the worker agent produces a structured report detailing the outcome, including changed files, logs, and a final status. **Its final instruction MUST be a handoff to the Scribe.**

**3. State Update (`@bmad-master`, Saul):**
*   **Input:** Receives the completed task report from a worker agent.
*   **Action:** Parses the unstructured report. Translates the outcome into structured data.
*   **Output:** Updates the `.ai/state.json` file with the results, appending the report to `agent_reports` and adding a new, specific signal to `system_signals` (e.g., `task_complete`, `code_rejected_by_qa`, `human_input_required`). **His final action is to hand off control back to the Orchestrator.**

This `Orchestrator -> Worker -> Scribe` cycle repeats, driving the project forward autonomously.

## The Shared State (`.ai/state.json`) Structure

This file is the single source of truth for the project's status.

```json
{
  "project_status": "in_progress", // "planning", "in_progress", "paused", "complete"
  "current_epic": "epic-1.md",
  "current_story": "1.1.story.md",
  "task_queue": [
    // Future tasks can be queued here by planning agents
  ],
  "system_signals": [
    // A log of machine-readable events from the Scribe
    {
      "timestamp": "2025-07-04T10:00:00Z",
      "agent": "dev",
      "signal": "task_complete",
      "story": "1.1.story.md",
      "details": "Implementation of user login endpoint finished."
    },
    {
      "timestamp": "2025-07-04T11:00:00Z",
      "agent": "qa",
      "signal": "code_rejected_by_qa",
      "story": "1.1.story.md",
      "details": "Rejected due to failing unit tests. See report for details."
    }
  ],
  "agent_reports": [
    // Full, unstructured text reports from worker agents
  ],
  "knowledge_base": {
    "prd_summary": "Summary of the PRD.",
    "architecture_summary": "Key architectural decisions."
  }
}
