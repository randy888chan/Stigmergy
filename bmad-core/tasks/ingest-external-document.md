# Ingest External Document Task

## Purpose
To process and integrate externally-created project documents (e.g., from a Web UI session) into the Pheromind system, preparing them for the autonomous execution cycle.

## Task Execution Instructions

[[LLM: You are executing the system's official Ingestion Protocol. You MUST follow these steps precisely.]]

### 1. Identify Target Documents
- The user will have placed their externally-created documents in the `docs/` directory.
- Your primary targets are `docs/prd.md` and `docs/architecture.md`.
- Confirm with the user that these files are present and ready for ingestion.

### 2. Process and Normalize PRD
- **Action:** Execute the `doc-migration-task` on `docs/prd.md`.
    - This will normalize all headings and prepare the document for sharding.
- **Action:** Execute the `shard-doc` task on the newly migrated `docs/prd.md`.
    - Set the destination to `docs/prd/`.
- **Verification:** Confirm that the `docs/prd/` directory now contains sharded epic files (e.g., `epic-1.md`). Report success or failure.

### 3. Process and Normalize Architecture
- **Action:** Execute the `doc-migration-task` on `docs/architecture.md`.
- **Action:** Execute the `shard-doc` task on the newly migrated `docs/architecture.md`.
    - Set the destination to `docs/architecture/`.
- **Verification:** Confirm that the `docs/architecture/` directory now contains sharded architecture components (e.g., `tech-stack.md`, `data-models.md`). Report success or failure.

### 4. Update System State
- **[[LLM: CRITICAL]]** - This is the final and most important step.
- Upon successful sharding of both documents, you MUST update the `.ai/state.json` file.
- **Action:** Set the `project_status` to `"READY_FOR_EXECUTION"`.
- **Action:** Add a `system_signal` indicating `"INGESTION_COMPLETE"`.

### 5. Report and Handoff
- Conclude with a report summarizing your actions.
- Example: "Ingestion complete. The PRD and Architecture documents have been processed and sharded. The project state is now 'READY_FOR_EXECUTION'."
- Conclude with the formal handoff back to `@bmad-master` to continue the Pheromind Cycle.
