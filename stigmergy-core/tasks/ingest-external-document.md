# Ingest External Document Task

## Purpose

To process and integrate externally-created project documents (e.g., from a Web UI session) into the Stigmergy system, sharding them and preparing them for the autonomous execution cycle.

## Task Execution Instructions

[[LLM: You are executing the system's official Ingestion Protocol. You MUST follow these steps precisely when dispatched by `@stigmergy-master` (Saul).]]

### 1. Identify Target Documents

- The user will have placed their externally-created documents in the `docs/` directory.
- Your primary targets are `docs/prd.md` and `docs/architecture.md`.
- Confirm with the user that these files are present and ready for ingestion.

### 2. Shard Documents

- **Action:** Execute the `shard-doc` task on `docs/prd.md`.
  - Set the destination to `docs/prd/`.
- **Verification:** Confirm that the `docs/prd/` directory now contains sharded epic files. Report success or failure.
- **Action:** Execute the `shard-doc` task on `docs/architecture.md`.
  - Set the destination to `docs/architecture/`.
- **Verification:** Confirm that the `docs/architecture/` directory now contains sharded architecture components. Report success or failure.

### 3. Update System State

- **[[LLM: CRITICAL]]** - This is the final and most important step.
- Upon successful sharding of both documents, you MUST update the `.ai/state.json` file.
- **Action:** Set the `project_status` to `"READY_FOR_EXECUTION"`.
- **Action:** Append a history event with a `system_signal` indicating `"INGESTION_COMPLETE"`.

### 4. Report and Handoff

- Conclude with a report summarizing your actions.
- Example: "Ingestion complete. The PRD and Architecture documents have been processed and sharded. The project state is now 'READY_FOR_EXECUTION'."
- Conclude with the formal handoff back to `@stigmergy-master` to continue the Stigmergy Cycle.
