# Story {{EpicNum}}.{{StoryNum}}: {{Short Title}}

## Status: {{ Draft | Approved | InProgress | Review | Done }}

## Story

- As a {{role}}
- I want {{action}}
- so that {{benefit}}

## Acceptance Criteria (ACs)

{{ Numbered list of Acceptance Criteria }}

---

## Tasks / Subtasks
<!-- 
  This section is for Olivia, the Execution Coordinator, to manage.
  She will decompose these high-level tasks into smaller, verifiable steps
  and manage the dev loop for each one sequentially.
-->
- [ ] Task 1 (AC: #): {{ Brief description of the first major task }}
- [ ] Task 2 (AC: #): {{ Brief description of the second major task }}
- [ ] Task 3 (AC: #): {{ etc... }}

---

## Dev Notes
<!-- 
  This section is populated by the @sm (Bob, the Task Decomposer).
  It contains only the critical, specific technical context from the 
  architecture documents needed for this story.
-->

**Relevant Architectural Snippets:**

- **Data Model `{{model_name}}`:**
  ```typescript
  // Snippet from docs/architecture/data-models.md
  interface {{model_name}} { ... }
  ```
- **API Endpoint `{{endpoint_path}}`:**
  ```yaml
  # Snippet from docs/architecture/rest-api-spec.md
  # ... spec for this endpoint
  ```
- **Component Props `{{component_name}}`:**
  ```typescript
  # Snippet from docs/architecture/components.md
  interface {{component_name}}Props { ... }
  ```

**Implementation Guidance:**
- Adhere strictly to the project's `coding-standards.md` and `qa-protocol.md`.
- All database interactions MUST use the established Repository Pattern.
- Note: No specific guidance for error handling was found in architecture docs; proceed with standard implementation. [EXAMPLE]

---

## Dev Agent Record
<!-- This section is for the @dev agent (James) to update upon completion. -->

**Agent Model Used:** {{Agent Model Name/Version}}

**Referenced Research:**
<!-- Links to documentation/Stack Overflow that were used to solve problems. -->

**Completion Notes:**
<!-- Notes for the next agent (e.g., Olivia, or the SM for the next story). -->

**Changelog:**
<!-- Auto-populated by a git hook in a future version. For now, manual. -->
| Date       | Version | Description                     | Author |
| :--------- | :------ | :------------------------------ | :----- |
| YYYY-MM-DD | 1.0     | Initial implementation of sub-tasks | @dev   |
