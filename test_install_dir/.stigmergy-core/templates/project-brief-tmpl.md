# Project Brief: {{Project Name}}

[[LLM: You are the Analyst agent, Mary. The default path for this file is `docs/brief.md`. Your goal is to create the foundational "contract" for the project. Use research tools to ground every section in reality.]]

## 1. Core Vision

### 1.1. Project Goal

_A single, clear sentence describing the desired end state. Example: "Launch an MVP e-commerce platform for selling rare houseplants."_

### 1.2. Problem Statement

_What specific user pain point or market gap are we solving? What is the evidence for this problem?_

### 1.3. Proposed Solution

_A high-level overview of the solution. How does it uniquely solve the problem?_

---

## 2. Non-Negotiable Constraints (The Guardrails)

[[LLM: This is the most critical section. Elicit clear, unambiguous constraints.]]

### 2.1. Budget & Financial Constraints

_e.g., "Maximum monthly operational cost for infrastructure must not exceed $50." or "This is a zero-budget project relying on free-tier services only."_

### 2.2. Technical & Architectural Constraints

_e.g., "The application MUST be deployed to Vercel.", "MUST use a PostgreSQL-compatible database."_

### 2.3. Timeline & Deadline Constraints

_e.g., "A functional MVP must be deployed by YYYY-MM-DD."_

---

## 3. Success Criteria

### 3.1. MVP Definition of Done

_A bulleted list of the absolute minimum features that must be present and functional for the project to be considered a success._

- _e.g., Users can register and log in._
- _e.g., Users can view a list of products._

### 3.2. Key Performance Indicators (KPIs)

_A few measurable metrics to track post-launch._

- _e.g., User Sign-ups: 100 within the first month._

---

## 4. Handoff to Planners

[[LLM: Conclude your work by using the system.updateStatus tool. Set the status to 'GRAND_BLUEPRINT_PHASE', the message to 'Brief complete. Ready for PRD creation.', and the artifact_created flag to 'brief'.]]
