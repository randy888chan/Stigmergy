# {{Project Name}} Product Requirements Document (PRD)

[[LLM: You are the PM agent, John. The default path for this file is `docs/prd.md`.
1. Review the Project Brief or user request to gather initial context.
2. IMPORTANT: Follow LAW VI (Mandatory Tool Usage). Use research tools to validate market assumptions or competitor features before defining requirements. Cite your findings.
3. Guide the user through this template section by section. Use the `advanced-elicitation` task after each major section to refine the content collaboratively.
4. Your goal is to produce a LEAN, ACTIONABLE PRD that serves as a clear blueprint.
]]

## 1. Introduction
[[LLM: Populate this section based on the user's initial request or the Project Brief. After presenting, immediately apply the `tasks#advanced-elicitation` protocol.]]

### 1.1. Problem Statement
*A concise summary of the core problem this product solves for the user.*

### 1.2. Proposed Solution
*A high-level overview of the product and its key value proposition.*

### 1.3. Goals & Success Metrics
| Goal                  | Metric                | Target           |
| :-------------------- | :-------------------- | :--------------- |
| **Business Goal**     | e.g., Increase user engagement | 15% uplift in DAU |
| **User Goal**         | e.g., Reduce time to complete task X | Under 30 seconds |
| **Technical Goal**    | e.g., Ensure high availability | 99.9% uptime     |

---

## 2. Requirements
[[LLM: Draft functional and non-functional requirements based on the goals and your initial research. After presenting this list, immediately apply `tasks#advanced-elicitation` to refine and challenge the requirements.]]

### 2.1. Functional Requirements
*FR1: The system shall allow users to register with an email and password.*
*FR2: ...*

### 2.2. Non-Functional Requirements
*NFR1: All API endpoints must respond in under 500ms on average.*
*NFR2: The system must be compliant with GDPR.*
*NFR3: ...*

### 2.3. Commercial & Cost Requirements
[[LLM: This is a mandatory section.]]
- **Monetization Strategy:** *e.g., Subscription-based model with 3 tiers.*
- **Lean MVP Scope Rationale:** *Justify why each feature is critical for the MVP. Ruthlessly defer non-essentials.*
- **Operational Cost Considerations:** *Propose a tech stack and architecture that minimizes recurring costs (e.g., favoring serverless, free-tier services where feasible).*

---

^^CONDITION: has_ui^^
## 3. User Experience & Design
[[LLM: Capture the high-level UI/UX vision. After drafting this section, apply `tasks#advanced-elicitation`.]]

### 3.1. User Personas
*Brief description of the primary and secondary user personas.*

### 3.2. Core User Flows
*A list of the most critical user journeys (e.g., "User Registration and Onboarding", "Creating a New Project").*

### 3.3. Accessibility
*Target accessibility standard, e.g., WCAG 2.1 AA.*
^^/CONDITION: has_ui^^

---

## 4. Epics & Stories
[[LLM: 
1. First, present just a high-level list of proposed epics for user approval. Each epic should have a title and a 1-sentence goal. Epics MUST be logically sequential (Epic 1 should set up project foundations). Apply `tasks#advanced-elicitation` to this list.
2. After the epic list is approved, present each epic's full details (stories and ACs) one by one. Apply `tasks#advanced-elicitation` after EACH epic before moving to the next.
]]

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
<<REPEAT: criteria>>
- {{criterion}}: {{description}}
<</REPEAT>>
<</REPEAT>>
<</REPEAT>>

---

## 5. Handoff
[[LLM: Once the user confirms the PRD is complete, execute the `pm-checklist` against the final document. Present the results and then provide a clear handoff prompt for the Architect.]]

### Checklist Results Report
[[LLM: Populate with results from `pm-checklist`.]]

### Architect Handoff Prompt
**To `@architect`:** "The Product Requirements Document for `{{Project Name}}` is complete and has been validated. Please review this PRD and begin creating the full technical architecture document. Pay close attention to the Non-Functional and Commercial Requirements, as they will constrain your design."
