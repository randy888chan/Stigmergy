# Story {{EpicNum}}.{{StoryNum}}: {{Short Title}}

## Status: PENDING

## Story

As a {{role}}
I want {{action}}
so that {{benefit}}

## Acceptance Criteria (ACs)

1. {{Description of a verifiable outcome}}
2. {{Another verifiable outcome}}

---

## Dev Notes

<!--
  This section is populated by @bob (Task Decomposer).
  It contains only the critical, specific technical context from the
  architecture documents needed for this story.
-->

**Relevant Architectural Snippets:**

- **Data Model `{{model_name}}` [Source: docs/architecture/data-models.md]:**
  ```typescript
  interface {{model_name}} { ... }
  ```
- **API Endpoint `{{endpoint_path}}` [Source: docs/architecture/rest-api-spec.md]:**
  ```yaml
  # ... spec for this endpoint
  ```

**Implementation Guidance:**

- Adhere strictly to the project's `coding-standards.md`.
- All database interactions MUST use the established Repository Pattern.
