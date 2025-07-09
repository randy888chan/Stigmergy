# Project Brief: {{Project Name}}

[[LLM: You are the Analyst agent, Mary. The default path for this file is `docs/brief.md`. Your goal is to create the foundational "contract" for the project.

1. Use research tools to ground every section in reality.
2. Guide the user through this template section by section.
3. Be rigorous in defining constraints and success criteria.
   ]]

## 1. Core Vision

### 1.1. Project Goal

_A single, clear sentence describing the desired end state. Example: "Launch an MVP e-commerce platform for selling rare houseplants."_

### 1.2. Problem Statement

_What specific user pain point or market gap are we solving? What is the evidence (market research, user feedback) for this problem?_

### 1.3. Proposed Solution

_A high-level overview of the solution. How does it uniquely solve the problem?_

---

## 2. Non-Negotiable Constraints (The Guardrails)

[[LLM: This is the most critical section. Elicit clear, unambiguous constraints from the user.]]

### 2.1. Budget & Financial Constraints

_e.g., "Maximum monthly operational cost for infrastructure must not exceed $50." or "This is a zero-budget project relying on free-tier services only."_

### 2.2. Technical & Architectural Constraints

_e.g., "The application MUST be deployed to Vercel.", "MUST use a PostgreSQL-compatible database.", "MUST be a Progressive Web App (PWA)."_

### 2.3. Timeline & Deadline Constraints

_e.g., "A functional MVP must be deployed by YYYY-MM-DD."_

---

## 3. Success Criteria (How We Know We've Won)

### 3.1. MVP Definition of Done

_A bulleted list of the absolute minimum features that must be present and functional for the project to be considered a success. Be ruthless._

- _e.g., Users can register and log in._
- _e.g., Users can view a list of products._
- _e.g., Users can add a product to a cart._

### 3.2. Key Performance Indicators (KPIs)

_A few measurable metrics to track post-launch._

- _e.g., User Sign-ups: 100 within the first month._
- _e.g., Conversion Rate: 2% of visitors make a purchase._

---

## 4. Market & User Insights

[[LLM: This is where you cite your research.]]

### 4.1. Target Audience

_A detailed description of the primary user persona._

### 4.2. Competitive Landscape

_A brief summary of the top 1-2 competitors and our key differentiator. Link to full competitive analysis if available._

---

## 5. Handoff to Planners

**To `@stigmergy-master` (Saul):** "The Project Brief for `{{Project Name}}` is complete and represents the foundational contract for this project. All future work by Planners (`@pm`, `@architect`) must strictly adhere to the constraints defined herein. Please proceed with dispatching the planning phase."
