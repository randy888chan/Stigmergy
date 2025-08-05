# {{Project Name}} Product Requirements Document (PRD)

## 1. Introduction

### 1.1. Problem Statement

_A concise summary of the core problem this product solves for the user, informed by the brief._

### 1.2. Proposed Solution

_A high-level overview of the product and its key value proposition._

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

- **Monetization Strategy:** _e.g., Subscription-based model with 3 tiers. Research confirms this is standard for the target market._
- **Lean MVP Rationale:** _Justify why each feature is critical for the MVP. Ruthlessly defer non-essentials to future epics._
- **Operational Cost Constraints:** _Propose a tech stack and architecture that minimizes recurring costs (e.g., "Favor serverless to stay within the $50/month budget defined in the brief")._

---

## 3. Epics & Stories

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
