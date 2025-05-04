# WasaPrecruit - Key Research Areas & Risk Mitigation

This document outlines critical areas requiring deep research before or during development to mitigate risks that could jeopardize the project's success. Findings will inform architecture, design, operational planning, and compliance.

## 1. WhatsApp Platform Compliance & Operations

**(Critical Risk: Platform Bans, Unexpected Costs, Operational Failure)**

*   **Rate Limiting & Throttling:**
    *   *Research Question:* Precise message sending limits (per number/account/timeframe) from WhatsApp/provider? Consequences (warning, throttle, suspension, ban) of exceeding limits?
    *   *Why:* Core function failure risk. Need data for architecture/throttling.
*   **Opt-In Management Requirements:**
    *   *Research Question:* Explicit requirements (WhatsApp/provider) for obtaining, documenting, proving user opt-in (aspirant messages first vs. agency initiated)?
    *   *Why:* Non-compliance risk (suspension/bans).
*   **Message Template Approval Process:**
    *   *Research Question:* Detailed process, approval time, criteria strictness for template approval? Rejection frequency/reasons?
    *   *Why:* Impacts core bot/automation functionality.
*   **WhatsApp Policy Deep Dive (Recruitment Context):**
    *   *Research Question:* Specific policy clauses (Business Platform, AUP) regarding recruitment, data handling, content types posing risk?
    *   *Why:* Avoid inadvertent policy violations leading to bans.
*   **Detailed Cost Modeling:**
    *   *Research Question:* Granular cost breakdown from API provider (conversation fees, template fees, per-message, number rental)? Accurate cost projection methods?
    *   *Why:* Financial viability risk.
*   **API Provider Reliability & SLAs:**
    *   *Research Question:* Documented SLAs, historical uptime, support responsiveness guarantees for the provider?
    *   *Why:* Platform reliability depends on provider reliability.

## 2. Scalability & Performance Validation

**(Critical Risk: Poor Performance, Inability to Handle Load)**

*   **Real-time Architecture Benchmarks:**
    *   *Research Question:* Reliable benchmarks/scaling characteristics for candidate backend tech (Node.js/Python/Elixir frameworks, WebSocket libs) under high-concurrency chat load?
    *   *Why:* Validate tech choices against scalability requirements.
*   **Database Choice Scalability Patterns:**
    *   *Research Question:* Proven scaling strategies (replicas, sharding, connection management) for candidate DBs (PostgreSQL, NoSQL) under high write/read chat load? Performance implications?
    *   *Why:* Prevent database bottlenecks.
*   **Cloud Provider Service Limits & Costs at Scale:**
    *   *Research Question:* Default limits and associated costs for relevant cloud services (DB connections, API Gateway, serverless concurrency, egress) under high load?
    *   *Why:* Avoid hitting unexpected cloud limits or costs.

## 3. Legal, Privacy & Compliance (Colombia)

**(Critical Risk: Legal Penalties, Data Breaches, Reputational Damage)**

*   **Colombian Data Protection Law (Law 1581, etc.):**
    *   *Research Question:* Specific requirements (consent, storage, retention, data subject rights, cross-border transfer) under Colombian law for data collected via chat/forms?
    *   *Why:* Compliance risk (fines, legal action).
*   **Labor Law Implications (Recruitment Communication):**
    *   *Research Question:* Specific Colombian labor laws governing recruitment communication content, timing, record-keeping?
    *   *Why:* Avoid violating employment regulations.

## 4. External Dependencies Reliability

**(Critical Risk: Feature Failure due to External Factors)**

*   **Web Form Security & Reliability:**
    *   *Research Question:* Best practices/failure points for secure (HTTPS, validation) and reliable (confirmation, retries) data capture/transmission from external form to API?
    *   *Why:* Core feature dependency. 