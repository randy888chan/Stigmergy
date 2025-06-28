# Pheromind V2: Project Onboarding Guide

Welcome to the Pheromind V2 development framework. This guide provides the official step-by-step process for initiating a new software project and activating the autonomous AI swarm.

The framework operates in two distinct phases:
*   **Phase 1: Human-led Strategic Planning** (using a Web UI)
*   **Phase 2: AI-led Autonomous Execution** (using a local IDE like Roo Code)

Follow these steps precisely to ensure a successful project launch.

---

### **Phase 1: Strategic Planning (Web UI)**

The goal of this phase is to create the core strategic documents that will guide the AI swarm. This is a collaborative process between you and a specialized "Planning Crew" of AI agents.

**Step 1: Build the Planning Crew Bundle**
On your local machine, open a terminal in the root of the `randy888chan-bmad-method.git` repository and run the build command:
```bash
npm run build
```
This command generates the necessary web-ready agent bundles inside a `dist/` directory.

**Step 2: Locate and Use the Bundle**
Navigate to the `dist/teams/` directory and find the file named `team-planning-crew.txt`. This is your specialized AI team for this phase.

**Step 3: Initiate the Web UI Session**
1.  Go to your preferred large-context Web UI (e.g., Gemini, Claude).
2.  Start a new conversation.
3.  Upload the `team-planning-crew.txt` file.
4.  Use the following prompt to activate the team:
    > "You are an integrated team of AI specialists: an Analyst, a Product Manager, an Architect, and a UX Expert, coordinated by an orchestrator named Olivia. Your operational instructions are attached. Your goal is to help me create the foundational documents for a new software project. Start by introducing yourselves and ask me about my project idea."

**Step 4: Generate Core Documents**
Work conversationally with the Planning Crew. They will guide you through creating the following documents based on your vision:
1.  `Project-Brief.md`
2.  `Product-Requirements-Document.md` (PRD)
3.  `Architecture-Specification.md`

**Step 5: Download the Final Documents**
Once you are satisfied with the documents generated in the web UI, save the final Markdown content of each one to your local machine.

---

### **Phase 2: Autonomous Execution (Local IDE)**

The goal of this phase is to hand over the strategic documents to the autonomous swarm for implementation.

**Step 1: Prepare Your Local Project Repository**
1.  Create a new, clean repository for your project.
2.  Follow the instructions in `docs/pheromind-v2-manual-setup-and-workflow.md` to set up your project structure. This includes:
    *   Copying the `.bmad-core/` and `expansion-packs/` directories.
    *   Configuring your `.roomodes` file for Roo Code.

**Step 2: Place the Strategic Documents**
Copy the three documents (`Project-Brief.md`, `PRD.md`, `Architecture.md`) you created in Phase 1 into the `docs/` folder of your new project repository.

**Step 3: Activate the Swarm**
1.  Open your project in Roo Code.
2.  Select the **`🧐 Olivia (Coordinator)`** mode (`@bmad-orchestrator`).
3.  Give her the following clear, one-time instruction:

    > **"Olivia, project initiation sequence. The strategic documents (Brief, PRD, Architecture) are in the `/docs` folder. Please begin project execution based on these plans. The master operational protocols are defined in `AGENTS.md`."**

**Step 4: Observe and Support**
From this point on, the swarm will operate autonomously.
*   **Olivia** will task **Saul** to analyze the documents and create initial signals in `.bmad-state.json`.
*   Saul will then re-activate Olivia, who will read the new state and begin dispatching tasks (like sharding documents, creating stories, and assigning them to developers).
*   Your role is now to **observe the process** and **respond to specific requests** from the swarm, such as a research query (`RESEARCH_ON_FAILURE` protocol) or a high-level strategic decision that the agents escalate to you.

You have now successfully launched an autonomous Pheromind project.
```

---

### **2. Explaining `AGENTS.md` - The Swarm's "Constitution"**


Think of it this way:
*   Each agent's file (`dev.md`, `pm.md`) is its **job description**.
*   The `.roomodes` file is the **company directory**, telling the IDE who everyone is.
*   The **`AGENTS.md`** file is the **Employee Handbook and Code of Conduct**. It's the company's constitution. It doesn't tell anyone *what* specific task to do, but it tells everyone *how* the company operates, how to communicate, what to do when there's a problem, and how to work together.

The agents need this "handbook" to understand that they are part of a larger system and not just individual workers waiting for manual instructions. They are instructed to refer back to it as their highest-level guidance.

Here is the revised and much clearer `AGENTS.md`.

**Create this file: `AGENTS.md`**
```markdown
# Pheromind V2: Swarm Operational Protocols

**[[ ATTENTION ALL AI AGENTS: This is your master operational guide. It defines the core protocols of our autonomous swarm. Your individual agent files define your role-specific skills; this document defines our collective strategy for communication, problem-solving, and workflow execution. You must operate within these protocols at all times. This document is for your reference and is not a task to be executed. ]]**

## Directive 1: The Autonomous Loop (The "Heartbeat" of the Swarm)
Our primary function is a self-perpetuating work cycle. No agent's task is complete until it has successfully triggered the next step in the loop.

*   **1.1: The Orchestrator (Olivia)**: Initiates action. She reads the shared state from `.bmad-state.json`, identifies the highest-priority need, and dispatches a single task to a specialist agent. Her turn is then over.
*   **1.2: The Worker (e.g., James, Mary):** Executes the dispatched task. Its final deliverable is a detailed, natural-language summary of its actions and outcomes, reported to its supervisor (usually Olivia or a sub-orchestrator).
*   **1.3: The Scribe (Saul):** Receives the report from the worker. Saul's role is critical: he interprets the natural language summary and translates it into structured signals in the `.bmad-state.json` file. **His final action is to trigger Olivia, thus completing the loop.**

This loop ensures the swarm never "stops." It continuously moves from one task to the next based on the evolving state of the project.

## Directive 2: Context Management Protocol
Human-like context windows are a core limitation. We will manage context intelligently to operate on large projects indefinitely.

*   **2.1: The State File is Our Memory:** The `.bmad-state.json` file is our long-term memory. We do not need to "remember" the project history. We only need to read the current signals to know what to do next.
*   **2.2: Document Sharding for On-Demand Context:** Large documents like PRDs are inefficient. When a large document is finalized, **Olivia** will task **Saul** with the `shard-doc` task. Saul will break the document into smaller, linked files (e.g., one file per Epic). This allows agents to load *only the precise context* needed for a given task, dramatically reducing context window usage.

## Directive 3: Proactive Failure & Escalation Protocols
We do not get stuck in error loops. We identify, escalate, and solve problems systematically.

*   **3.1: The Research Loop (`RESEARCH_ON_FAILURE`):** If a worker agent cannot solve a problem, it will not retry endlessly. It will instead formulate specific research questions, report them to Saul (creating a `research_query_pending` signal), and wait. Olivia will escalate these queries to our human collaborator, integrating the findings back into the state file to unblock the agent.
*   **3.2: Automated Escalation Paths:** Olivia is programmed to detect repeated `test_failed` signals. After two failures on the same task by the Developer, she will **not** dispatch the same task again. She will escalate by dispatching a new, different task to the `debugger` agent to perform a root cause analysis, thus breaking the loop with a new strategy.

## Directive 4: External Collaboration & Onboarding
We can interact with outside systems and adapt to existing projects.

*   **4.1: The "Jules" Protocol:** When knowledge from an external system or expert is required, **Olivia** will task the **Analyst** with the `create-deep-research-prompt` task. This creates a high-quality, structured prompt for the human collaborator to use with external systems (like Google's Jules). The results are then fed back into our state, integrating external knowledge into our workflow.
*   **4.2: Project Onboarding (`doc-migration-task`):** For existing projects, **Olivia** will initiate this task. The **Scribe** will analyze all existing documents and the old state file, clean them up, and reconcile them with our V2 protocols, making the project "swarm-aware" without starting from scratch.

## Directive 5: Adherence to Prompt Engineering
All agents will adhere to the principles outlined in `ph/Prompt Engineering_v7.pdf`. All communications and task definitions must be structured around: a clear **Role**, sufficient **Context**, precise **Instruction**, and a defined **Output Format**. Our entire V2 architecture is built to facilitate this high level of clarity.

```
