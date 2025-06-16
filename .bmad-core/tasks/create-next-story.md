# Create Next Story Task

## Purpose

To identify the next logical story based on project progress and epic definitions, and then to prepare a comprehensive, self-contained, and actionable story file using the `Story Template`. This task ensures the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research.

## Inputs for this Task

- Access to the project's documentation repository, specifically:
  - `docs/index.md` (hereafter "Index Doc")
  - All Epic files - located in one of these locations:
    - Primary: `docs/prd/epic-{n}-{description}.md` (e.g., `epic-1-foundation-core-infrastructure.md`)
    - Secondary: `docs/epics/epic-{n}-{description}.md`
    - User-specified location if not found in above paths
  - Existing story files in `docs/stories/`
  - Full-Stack Architecture Document (`docs/full-stack-architecture.md`)
  - UI/UX Specification Document (`docs/ui-ux-spec.md`)
- The `.bmad-core/templates/story-tmpl.md` (hereafter "Story Template")
- The `.bmad-core/checklists/story-draft-checklist.md` (hereafter "Story Draft Checklist")
- User confirmation to proceed with story identification and, if needed, to override warnings about incomplete prerequisite stories.

## Task Execution Instructions

### 1. Identify Next Story for Preparation

#### 1.1 Locate Epic Files

- First, determine where epic files are located:
  - Check `docs/prd/` for files matching pattern `epic-{n}-*.md`
  - If not found, check `docs/epics/` for files matching pattern `epic-{n}-*.md`
  - If still not found, ask user: "Unable to locate epic files. Please specify the path where epic files are stored."
- Note: Epic files follow naming convention `epic-{n}-{description}.md` (e.g., `epic-1-foundation-core-infrastructure.md`)

#### 1.2 Review Existing Stories

- Review `docs/stories/` to find the highest-numbered story file.
- **If a highest story file exists (`{lastEpicNum}.{lastStoryNum}.story.md`):**

  - Verify its `Status` is 'Done' (or equivalent).
  - If not 'Done', present an alert to the user:

    ```plaintext
    ALERT: Found incomplete story:
    File: {lastEpicNum}.{lastStoryNum}.story.md
    Status: [current status]

    Would you like to:
    1. View the incomplete story details (instructs user to do so, agent does not display)
    2. Cancel new story creation at this time
    3. Accept risk & Override to create the next story in draft

    Please choose an option (1/2/3):
    ```

  - Proceed only if user selects option 3 (Override) or if the last story was 'Done'.
  - If proceeding: Look for the Epic File for `{lastEpicNum}` (e.g., `epic-{lastEpicNum}-*.md`) and check for a story numbered `{lastStoryNum + 1}`. If it exists and its prerequisites (per Epic File) are met, this is the next story.
  - Else (story not found or prerequisites not met): The next story is the first story in the next Epic File (e.g., look for `epic-{lastEpicNum + 1}-*.md`, then `epic-{lastEpicNum + 2}-*.md`, etc.) whose prerequisites are met.

- **If no story files exist in `docs/stories/`:**
  - The next story is the first story in the first epic file (look for `epic-1-*.md`, then `epic-2-*.md`, etc.) whose prerequisites are met.
- If no suitable story with met prerequisites is found, report to the user that story creation is blocked, specifying what prerequisites are pending. HALT task.
- Announce the identified story to the user: "Identified next story for preparation: {epicNum}.{storyNum} - {Story Title}".

### 2. Gather Core Story Requirements (from Epic File)

- For the identified story, open its parent Epic File (e.g., `epic-{epicNum}-*.md` from the location identified in step 1.1).
- Extract: Exact Title, full Goal/User Story statement, initial list of Requirements, all Acceptance Criteria (ACs), and any predefined high-level Tasks.
- Keep a record of this original epic-defined scope for later deviation analysis.

### 3. Review Previous Story and Extract Dev Notes

[[LLM: This step is CRITICAL for continuity and learning from implementation experience]]

- If this is not the first story (i.e., previous story exists):
  - Read the previous story file: `docs/stories/{prevEpicNum}.{prevStoryNum}.story.md`
  - Pay special attention to:
    - Dev Agent Record sections (especially Completion Notes and Debug Log References)
    - Any deviations from planned implementation
    - Technical decisions made during implementation
    - Challenges encountered and solutions applied
    - Any "lessons learned" or notes for future stories
  - Extract relevant insights that might inform the current story's preparation

### 4. Gather & Synthesize Architecture Context from Consolidated Documentation

[[LLM: CRITICAL - You MUST gather technical details from the consolidated architecture document. NEVER make up technical details not found in this document.]]

#### 4.1 Review Full-Stack Architecture Document

- Read `docs/full-stack-architecture.md` to understand the complete system architecture
- Extract relevant sections based on story type:
  - Tech Stack section - Technology constraints and versions
  - Data Models section - Data structures and validation rules
  - REST API Spec section - API endpoint specifications
  - Components section - UI component specifications
  - Database Schema section - Database design and relationships
  - Frontend Architecture section - Component structure and patterns
  - Backend Architecture section - Service patterns and structure
  - Testing Strategy section - Testing requirements and strategies

#### 4.2 Review UI/UX Specification (For Frontend Stories)

- For stories involving UI components, user flows, or frontend functionality:
  - Read `docs/ui-ux-spec.md` to understand design requirements and user experience patterns
  - Extract relevant sections:
    - User Personas & Use Cases - Understanding target users and their workflows
    - Design System & Visual Language - Component styling and design patterns
    - Core User Flows & Interaction Patterns - Specific user journey requirements
    - Component Library Specification - Detailed component requirements and props
    - Accessibility Implementation - WCAG compliance and accessibility requirements
    - Responsive Design Strategy - Mobile-first design patterns and breakpoints
- Skip this step for backend-only stories with no UI components

#### 4.3 Extract Story-Specific Technical Details

[[LLM: As you read the document, extract ONLY the information directly relevant to implementing the current story. Do NOT include general information unless it directly impacts the story implementation.]]

**For Backend Stories:** Focus on service architecture, data models, API specs, database schema
**For Frontend Stories:** Focus on component architecture, state management, routing, UI specifications
**For Full-Stack Stories:** Extract relevant information from both domains

For the current story, extract:

- Specific data models, schemas, or structures the story will use
- API endpoints the story must implement or consume
- Component specifications for UI elements in the story
- File paths and naming conventions for new code
- Testing requirements specific to the story's features
- Security or performance considerations affecting the story

#### 4.4 Document Source References

[[LLM: ALWAYS cite the source document and section for each technical detail you include. This helps the dev agent verify information if needed.]]

Format references as: `[Source: full-stack-architecture.md#{section}]` or `[Source: ui-ux-spec.md#{section}]`
Examples: 
- `[Source: full-stack-architecture.md#tech-stack-section]`
- `[Source: ui-ux-spec.md#component-library-specification]`

### 5. Verify Project Structure Alignment

- Cross-reference the story's requirements and anticipated file manipulations with the project structure information from `docs/full-stack-architecture.md`.
- Ensure any file paths, component locations, or module names implied by the story align with defined structures.
- Document any structural conflicts, necessary clarifications, or undefined components/paths in a "Project Structure Notes" section within the story draft.

### 6. Populate Story Template with Full Context

- Create a new story file: `docs/stories/{epicNum}.{storyNum}.story.md`.
- Use the Story Template to structure the file.
- Fill in:
  - Story `{EpicNum}.{StoryNum}: {Short Title Copied from Epic File}`
  - `Status: Draft`
  - `Story` (User Story statement from Epic)
  - `Acceptance Criteria (ACs)` (from Epic, to be refined if needed based on context)
- **`Dev Technical Guidance` section (CRITICAL):**

  [[LLM: This section MUST contain ONLY information extracted from the architecture and UI/UX specification documents. NEVER invent or assume technical details.]]

  - Include ALL relevant technical details gathered from Steps 3 and 4, organized by category:
    - **Previous Story Insights**: Key learnings or considerations from the previous story
    - **Architecture Context**: Relevant patterns and constraints [Source: full-stack-architecture.md#{relevant-section}]
    - **Tech Stack Requirements**: Specific technologies and versions [Source: full-stack-architecture.md#{tech-stack-section}]
    - **Data Models**: Specific schemas, validation rules, relationships [Source: full-stack-architecture.md#{data-models-section}]
    - **API Specifications**: Endpoint details, request/response formats, auth requirements [Source: full-stack-architecture.md#{api-spec-section}]
    - **Component Specifications**: UI component details, props, state management [Source: full-stack-architecture.md#{frontend-architecture-section}]
    - **UI/UX Requirements**: Design system requirements, user flows, accessibility requirements [Source: ui-ux-spec.md#{relevant-section}] (for frontend stories)
    - **File Locations**: Exact paths where new code should be created based on project structure
    - **Testing Requirements**: Specific test cases or strategies [Source: full-stack-architecture.md#{testing-strategy-section}]
    - **Technical Constraints**: Version requirements, performance considerations, security rules
  - Every technical detail MUST include its source reference: `[Source: full-stack-architecture.md#{section}]` or `[Source: ui-ux-spec.md#{section}]`
  - If information for a category is not found in the architecture docs, explicitly state: "No specific guidance found in architecture docs"

- **`Tasks / Subtasks` section:**
  - Generate a detailed, sequential list of technical tasks based ONLY on:
    - Requirements from the Epic
    - Technical constraints from full-stack-architecture.md
    - Testing requirements from full-stack-architecture.md testing strategy section
  - Each task must reference relevant architecture documentation
  - Include unit testing as explicit subtasks based on testing strategy
  - Link tasks to ACs where applicable (e.g., `Task 1 (AC: 1, 3)`)
- Add notes on project structure alignment or discrepancies found in Step 5.
- Prepare content for the "Deviation Analysis" based on any conflicts between epic requirements and architecture constraints.

### 7. Run Story Draft Checklist

- Execute the Story Draft Checklist against the prepared story
- Document any issues or gaps identified
- Make necessary adjustments to meet quality standards
- Ensure all technical guidance is properly sourced from architecture and UI/UX specification docs

### 8. Finalize Story File

- Review all sections for completeness and accuracy
- Verify all source references are included for technical details
- Ensure tasks align with both epic requirements and architecture constraints
- Update status to "Draft"
- Save the story file to `docs/stories/{epicNum}.{storyNum}.story.md`

### 9. Report Completion

Provide a summary to the user including:

- Story created: `{epicNum}.{storyNum} - {Story Title}`
- Status: Draft
- Key technical components included from full-stack-architecture.md and ui-ux-spec.md (if applicable)
- Any deviations or conflicts noted between epic requirements and architecture constraints
- Recommendations for story review before approval
- Next steps: Story should be reviewed by PO for approval before dev work begins

[[LLM: Remember - The success of this task depends on extracting real, specific technical details from the consolidated full-stack-architecture.md document and ui-ux-spec.md (for frontend stories). The dev agent should have everything they need in the story file without having to search through multiple documents.]]
