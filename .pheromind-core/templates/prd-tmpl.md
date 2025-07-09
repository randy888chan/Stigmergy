# {{Project Name}} Product Requirements Document (PRD)

[[LLM: You are the PM agent, John. The default path for this file is `docs/prd.md`.

1. Review the Project Brief or user request to gather initial context.
2. IMPORTANT: Follow LAW III (Research First). Use research tools to validate market assumptions or competitor features before defining requirements. Cite your findings.
3. Guide the user through this template section by section.
4. Your goal is to produce a LEAN, ACTIONABLE PRD that serves as a clear blueprint.
   ]]

## 1. Introduction

### 1.1. Problem Statement
*A concise summary of the core problem this product solves for the user.*

### 1.2. Proposed Solution
*A high-level overview of the product and its key value proposition.*

### 1.3. Goals & Success Metrics

| Goal               | Metric                               | Target            |
| :----------------- | :----------------------------------- | :---------------- |
| **Business Goal**  | e.g., Increase user engagement       | 15% uplift in DAU |
| **User Goal**      | e.g., Reduce time to complete task X | Under 30 seconds  |
| **Technical Goal** | e.g., Ensure high availability       | 99.9% uptime      |

---

## 2. Requirements

### 2.1. Functional Requirements
_FR1: The system shall allow users to register with an email and password._
_FR2: ..._

### 2.2. Non-Functional Requirements
_NFR1: All API endpoints must respond in under 500ms on average._
_NFR2: ..._

### 2.3. Commercial & Cost Requirements (CRITICAL)
*This section is non-negotiable and guides the architecture.*
- **Monetization Strategy:** *e.g., Subscription-based model with 3 tiers. Research confirms this is standard for the target market.*
- **Lean MVP Rationale:** *Justify why each feature is critical for the MVP. Ruthlessly defer non-essentials to future epics.*
- **Operational Cost Constraints:** *Propose a tech stack and architecture that minimizes recurring costs (e.g., "Favor serverless to stay within the $50/month budget defined in the brief").*

---

## 3. Epics & Stories

[[LLM:
1. First, present just a high-level list of proposed epics for user approval. Epics MUST be logically sequential.
2. After the epic list is approved, present each epic's full details (stories and ACs) one by one.
]]

<<REPEAT: epic_details>>
## Epic {{epic_number}}: {{epic_title}}
**Goal:** {{Expanded goal - 2-3 sentences describing the value this epic delivers.}}

<<REPEAT: story>>
### Story {{epic_number}}.{{story_number}}: {{story_title}}
As a {{user_type}},
I want {{action}},
so that {{benefit}}.

#### Acceptance Criteria
- {{criterion}}: {{description}}
<</REPEAT>>
<</REPEAT>>
