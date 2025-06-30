# Pheromind V2: Project Onboarding Guide

Welcome to the Pheromind V2 development framework. This guide provides the official step-by-step process for initiating a new software project and activating the autonomous AI swarm.

The framework operates in two distinct phases:
*   **Phase 1: Human-led Strategic Planning** (using a Web UI like Gemini or directly in your IDE with `@analyst`)
*   **Phase 2: AI-led Autonomous Execution** (using your local IDE, e.g., Roo Code)

Follow these steps precisely to ensure a successful project launch.

---

### **Phase 1: Strategic Planning (Web UI or IDE)**

The goal of this phase is to create the core strategic documents that will guide the AI swarm. This is a collaborative process between you and a specialized "Planning Crew" of AI agents.

**Step 1: Choose Your Environment**
*   **For Web UI (e.g., Gemini, Claude):** A great option for free-form brainstorming. First, run `npm run build` in your terminal. Then, upload the `dist/teams/team-planning-crew.txt` file and give the initial prompt.
*   **For IDE (Recommended for Power Users):** Directly use the `@analyst` (Mary) and `@pm` (John) agents in Roo Code. They now have web search capabilities and can work with you to create the planning documents right in your project.

**Step 2: Generate Core Documents**
Work conversationally with the planning agents. Your goal is to produce:
1.  `Project-Brief.md`
2.  `Product-Requirements-Document.md` (PRD)
3.  `Architecture-Specification.md`

The Analyst agent, Mary, will now autonomously use web search tools to enrich these documents with market and competitor data.

**Step 3: Save the Final Documents**
Ensure the final versions of these three documents are saved in your project's `docs/` folder before proceeding.

---

### **Phase 2: Autonomous Execution (Local IDE)**

The goal of this phase is to hand over the strategic plan to the autonomous swarm for implementation.

**Step 1: Activate the Swarm**
1.  Open your project in Roo Code.
2.  Select the **`🧐 Olivia (Coordinator)`** mode (`@bmad-orchestrator`).
3.  Give her the following clear, one-time instruction:

    > **"Olivia, project initiation sequence. The strategic documents (Brief, PRD, Architecture) are in the `/docs` folder. Please begin project execution based on these plans. Your master operational protocols are defined in `AGENTS.md`."**

**Step 4: Observe and Support**
From this point on, the swarm will operate autonomously according to the `AGENTS.md` protocols:
*   **Olivia** will task **Saul** (`@bmad-master`) to analyze the documents and create initial signals in `.bmad-state.json`.
*   Saul will then re-activate Olivia, who will read the new state and begin dispatching tasks (like sharding documents, creating stories, and assigning them to developers).
*   Your role is now to **observe the process** and **respond to specific requests** from the swarm, such as a `research_query_pending` signal that requires your input or a high-level strategic decision that the agents escalate to you.

You have now successfully launched an autonomous Pheromind project with enhanced coordination and intelligence.
