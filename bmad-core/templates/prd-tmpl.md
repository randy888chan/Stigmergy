# {{Project Name}} Product Requirements Document (PRD)

[[LLM: The default path and filename unless specified is docs/prd.md. Start by reviewing any Project Brief provided to gather initial context.]]

## Goals and Background Context
[[LLM: Populate the two child sections below based on the user's initial request or the Project Brief. After presenting this section, immediately apply the `tasks#advanced-elicitation` protocol to allow the user to refine this foundational context before we proceed.]]

### Goals
[[LLM: Create a bulleted list of 1-line desired outcomes this PRD will deliver if successful.]]

### Background Context
[[LLM: Write 1-2 short paragraphs summarizing the "why" behind this project—the problem it solves, the target user, and the business opportunity.]]

### Change Log
| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |

---

## Requirements
[[LLM: Draft the functional and non-functional requirements based on the goals. After presenting this initial list, immediately apply the `tasks#advanced-elicitation` protocol. This is a critical step to challenge and refine the requirements before they are set.]]

### Functional
[[LLM: Each Requirement will be a bullet markdown with an identifier sequence starting with FR. Example: - FR1: The system shall allow users to register with an email and password.]]

### Non Functional
[[LLM: Each Requirement will be a bullet markdown with an identifier sequence starting with NFR. Example: - NFR1: All API endpoints must respond in under 500ms.]]

---

^^CONDITION: has_ui^^
## User Interface Design Goals
[[LLM: Capture the high-level UI/UX vision. After drafting this entire section (all sub-parts), apply the `tasks#advanced-elicitation` protocol.]]

### Overall UX Vision
[[LLM: A brief narrative describing the desired look, feel, and user interaction style.]]

### Core Screens and Views
[[LLM: List the most critical screens or views needed to fulfill the product's purpose. This is a conceptual list to guide the architect.]]

### Accessibility Target
[[LLM: Specify the target accessibility standard, e.g., WCAG 2.1 AA.]]

### Branding & Style
[[LLM: Note any known branding elements, color palettes, or style guides that must be incorporated.]]
^^/CONDITION: has_ui^^

---

## Technical Assumptions
[[LLM: Gather technical decisions that will constrain the Architect. Check for `data#technical-preferences`. For unknowns, offer suggestions with rationale. After drafting this section, apply the `tasks#advanced-elicitation` protocol.]]

### Repository Structure
[[LLM: e.g., Monorepo or Polyrepo. Provide a recommendation if the user is unsure.]]

### Service Architecture
[[LLM: The high-level service architecture, e.g., Monolith, Microservices, Serverless Functions.]]

### Technology Preferences
[[LLM: List any user-specified preferences for languages, frameworks, or cloud providers.]]

---

## Epics
[[LLM: First, present just a high-level list of proposed epics for user approval. Each epic should have a title and a 1-sentence goal. Apply the `tasks#advanced-elicitation` protocol to this list.

**CRITICAL:** Epics must be logically sequential. Epic 1 must establish project foundations (setup, CI/CD, etc.) while delivering a small, tangible piece of functionality.]]

<<REPEAT: epic_list>>
- **Epic {{epic_number}}: {{epic_title}}** - {{short_goal}}
<</REPEAT>>

[[LLM: After the epic list is approved, present each epic's full details (stories and ACs) one by one. After presenting EACH epic, apply the `tasks#advanced-elicitation` protocol before moving to the next.]]

<<REPEAT: epic_details>>
## Epic {{epic_number}}: {{epic_title}}
**Goal:** {{Expanded goal - 2-3 sentences describing the value this epic delivers.}}

[[LLM: Stories must be small, sequential "vertical slices" of functionality. Each should be completable by an AI agent in a single session.]]

<<REPEAT: story>>
### Story {{epic_number}}.{{story_number}}: {{story_title}}
As a {{user_type}},
I want {{action}},
so that {{benefit}}.

#### Acceptance Criteria
[[LLM: Define clear, testable acceptance criteria.]]
<<REPEAT: criteria>>
- {{criterion}}: {{description}}
<</REPEAT>>
<</REPEAT>>
<</REPEAT>>

---

## Checklist & Handoff
[[LLM: Once the user confirms the PRD is complete, execute the `pm-checklist` against the final document. Present the results and then provide a clear handoff prompt for the Architect.]]

### Checklist Results Report
[[LLM: Populate with results from `pm-checklist`.]]

### Architect Handoff Prompt
**To `@architect`:** "The Product Requirements Document for `{{Project Name}}` is complete and has been validated. Please review this PRD and begin creating the full technical architecture document."
