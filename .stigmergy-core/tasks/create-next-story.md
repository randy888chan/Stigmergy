# Create Next Story Task

## Purpose

To deterministically identify the next sequential story from the current epic, enrich it with specific technical context from architecture documents, and generate a comprehensive, self-contained story file ready for a developer agent.

## Task Execution Instructions

### [[LLM: This is a critical system task. You MUST follow these steps precisely to ensure the creation of a high-quality, actionable story for the developer agent and to maintain the autonomous loop.]]

### 0. Load Core Configuration & State

- **[[LLM: CRITICAL - This MUST be your first action.]]**
- Load the contents of `.ai/state.json` to identify the `current_epic`.
- Load the contents of `bmad-core/core-config.yml` to identify the locations of the sharded PRD (`prdShardedLocation`), sharded architecture (`architectureShardedLocation`), and story files (`dev-story-location`).
- If any of these files do not exist or cannot be parsed, HALT and report the issue to `@bmad-master`.

### 1. Identify Next Story for Preparation

- Using the `dev-story-location` from the config, scan for all existing story files related to the `current_epic`. Determine the highest story number already created (e.g., if `1.3.story.md` is the last one, the next is 1.4). If no stories exist for the epic, the next story is number 1.
- Open the epic file (e.g., `{prdShardedLocation}/epic-1.md`).
- Find the corresponding story block in the markdown for the story you are about to create.
- Extract the Story Title, the full "As a..., I want..., so that..." statement, and all of its Acceptance Criteria.
- Announce your finding: "Next story identified for preparation: {epicNum}.{storyNum} - {Story Title}".

### 2. Synthesize Context from Architecture

- **[[LLM: CRITICAL - You MUST enrich the story with specific technical guidance. Do not just link to the architecture.]]**
- Based on the story's content and Acceptance Criteria, identify relevant shards in the `{architectureShardedLocation}` directory (e.g., if the story mentions user data, load `data-models.md`; if it mentions a UI button, load `components.md`).
- Extract _only the specific, relevant snippets_ from these files. For example, the exact data model for a `User`, the specific API endpoint definition for `/users/create`, or the required props for a `PrimaryButton` component.
- **ALWAYS** cite the source file for each piece of information extracted (e.g., `[Source: docs/architecture/data-models.md]`). This is non-negotiable.

### 3. Populate Story Template with Full Context

- Create a new story file named `{dev-story-location}/{epicNum}.{storyNum}.story.md`.
- Use the `story-tmpl.md` as the base structure.
- **Populate the `Dev Notes` section (CRITICAL):**
  - Synthesize the technical snippets you extracted into a concise technical briefing for the developer. Do NOT invent technical details. If a required piece of information is missing from the architecture documents, you MUST state this explicitly (e.g., "Note: No specific guidance for error handling was found in architecture docs; proceeding with standard implementation.").
- **Generate `Tasks / Subtasks`:**
  - Create a detailed, sequential list of technical tasks required to implement the story. These tasks should be derived directly from the story's requirements and the technical guidance you just compiled.
  - Where possible, link each task back to the specific Acceptance Criteria it fulfills (e.g., `Task 1 (AC: #2, #3)`).

### 4. Finalize and Report

- Set the story's `Status:` field to `Draft`.
- Run the `story-draft-checklist` against the generated story to ensure quality and completeness. Address any gaps.
- Conclude by formally handing off to the Scribe: **"Task complete. Story {epicNum}.{storyNum} - {Story Title} has been created at `{dev-story-location}/{epicNum}.{storyNum}.story.md` and is in 'Draft' state. Handoff to @bmad-master for state update."**
