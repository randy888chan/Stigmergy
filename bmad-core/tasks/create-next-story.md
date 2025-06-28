# Create Next Story Task

## Purpose
To identify the next logical story based on project progress and epic definitions, and then to prepare a comprehensive, self-contained, and actionable story file using the `Story Template`. This task ensures the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research.

## Task Execution Instructions

### [[LLM: This is a complex task requiring strict adherence to the process to ensure the creation of a high-quality, actionable story for the developer agent.]]

### 0. Load Core Configuration & State
- **[[LLM: CRITICAL - This MUST be your first step]]**
- Load `.bmad-core/core-config.yml` and `.bmad-state.json` from the project root.
- If `core-config.yml` does not exist, HALT and inform the user.
- From config, extract: `dev-story-location`, PRD settings (`prdSharded`, `prd-file`, `prdShardedLocation`, `epicFilePattern`), and Architecture settings (`architectureSharded`, `architecture-file`, `architectureShardedLocation`).
- From state, use the `project_documents` map to confirm locations of current official documents.

### 1. Identify Next Story for Preparation
- Review `dev-story-location` to find the highest-numbered completed story (`{lastEpicNum}.{lastStoryNum}.story.md`).
- If no stories exist, the next story is Epic 1, Story 1.
- If stories exist, determine the next story number sequentially from the last completed one. Find the corresponding Epic file (e.g., `epic-{epicNum}.md`) in the `prdShardedLocation` or monolithic `prd-file`.
- Extract the story's Title, User Story statement, and Acceptance Criteria from the epic.
- Announce the identified story: "Identified next story for preparation: {epicNum}.{storyNum} - {Story Title}".

### 2. Synthesize Context from Architecture
- **[[LLM: CRITICAL - You MUST gather specific technical details from the sharded architecture documents. Do not load the entire architecture.]]**
- Based on the story's content and requirements, identify which architecture shards are relevant (e.g., if it's a UI story, look at `frontend-architecture.md`, `components.md`; if it's a backend story, look at `data-models.md`, `rest-api-spec.md`).
- Extract *only the specific, relevant snippets* from these files. Examples:
  - The exact data model schema for a `User` object.
  - The specific API endpoint definition for `/users/create`.
  - The required props for a `Button` component.
- **ALWAYS** cite the source file for each piece of information (e.g., `[Source: architecture/data-models.md]`).

### 3. Populate Story Template with Full Context
- Create a new story file: `{dev-story-location}/{epicNum}.{storyNum}.story.md`.
- Use the `story-tmpl.md` to structure the file.
- **Fill the `Dev Technical Guidance` section (CRITICAL):**
  - Synthesize the technical snippets extracted from the architecture shards.
  - Provide a concise but complete technical briefing for the developer. NEVER make up technical details. If information is missing from architecture, state it explicitly: "No specific guidance for XYZ found in architecture docs."
- **Generate `Tasks / Subtasks`:**
  - Create a detailed, sequential list of technical tasks based *only* on the story's requirements and the technical guidance you just compiled.
  - Link tasks to Acceptance Criteria where possible.

### 4. Finalize and Report
- Run the `story-draft-checklist` against the generated story to ensure quality.
- Set the story `Status: Draft`.
- Report to Olivia that the story is created and ready for PO review: "Story {epicNum}.{storyNum} - {Story Title} has been created at `{dev-story-location}/{epicNum}.{storyNum}.story.md`. It is now in 'Draft' state and requires Product Owner approval before being assigned for development."
