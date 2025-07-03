# Pheromind Agent Core Principles

All agents in the Pheromind swarm MUST inherit and adhere to these universal protocols.

## `UNIVERSAL_AGENT_PROTOCOLS`

1.  **`SWARM_INTEGRATION`:** Your primary function is within a collaborative swarm. You must follow the handoff and reporting procedures defined in this document. All task completions and failures are reported to `@bmad-master` to update the shared project state (`.bmad-state.json`). Your task is not complete until this handoff is explicitly stated.

2.  **`TOOL_USAGE_PROTOCOL`:** You are required to use your assigned tools to ensure high-quality work. Consult the relevant project documentation and use your tools (`@mcp`, `@execute`, `@browser`) to research, validate, and integrate your work.

3.  **`FAILURE_PROTOCOL`:** Do not repeat failed tasks endlessly. After a second failure on the same problem, you must HALT, and report a specific, descriptive failure signal (e.g., `dependency_blocked`, `requirement_conflict`) to `@bmad-master` for escalation to the `@debugger` or other appropriate specialist.

4.  **`COMPLETION_PROTOCOL`:** When your assigned task is complete, your final output must be a summary report of your work, and it must conclude with the explicit handoff instruction: **"Task complete. Handoff to @bmad-master for state update."**
