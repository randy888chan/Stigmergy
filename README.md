# Pheromind: An AI Coding System

At its core, this system utilizes:

- **Swarm Intelligence (Stigmergy):** Agents interact indirectly through a shared, dynamic information medium – their "digital scent." This allows for emergent coordination, dynamic task allocation, and robust problem-solving without centralized bottlenecks.
- **AI-Verifiable Methodology:** Progress is not just about completing tasks; it's about achieving **concrete, measurable, and AI-confirmable outcomes.** This ensures unparalleled transparency and reliability throughout the project lifecycle.
- **Natural Language Driven Coordination:** Our innovative system enables AI agents to interpret and act upon rich, nuanced information, fostering a level of sophisticated collaboration previously unattainable in automated systems.

---

## 🚀 The Pheromind Hybrid Workflow

Pheromind uses a powerful hybrid workflow that leverages the strengths of both Web UIs and local IDEs.

### **Phase 1: High-Level Planning (Web UI)**
This phase is for defining the project's vision and creating the core planning documents.

1.  **Get the Planning Bundle:** Find the `team-planning-crew.txt` bundle in the `dist/teams/` directory. This contains the Analyst, PM, Architect, and UX Expert.
2.  **Interact in your Web UI (Gemini, Claude, etc.):** Upload the bundle and work with the planning agents to produce:
    *   `Project-Brief.md`
    *   `Product-Requirements-Document.md`
    *   `Architecture-Specification.md`
3.  **Download Artifacts:** Save these final documents to your local machine.

### **Phase 2: Autonomous Development (Local IDE)**
This phase is for handing off the plan to the autonomous swarm for execution.

1.  **Set Up Your Project:** Use the instructions in `docs/pheromind-v2-manual-setup-and-workflow.md` to configure your local project and IDE (e.g., Roo Code).
2.  **Place Your Documents:** Copy the documents you downloaded from the Web UI into your project's `docs/` folder.
3.  **Initiate the Swarm:** In your IDE, activate the main orchestrator agent, **Olivia (`@bmad-orchestrator`)**, and give her a simple directive like: *"A new PRD and Architecture spec are in the docs folder. Please begin project execution."*
4.  **Observe:** The swarm will now begin the autonomous loop. It will analyze and shard the documents, create stories, write code, test, and manage the entire development process based on the state file (`.bmad-state.json`), with minimal further intervention required.

---

## Available Agents & Expansion Packs
*(This section remains the same, listing all available agents for the swarm's use during the autonomous phase.)*

## Installation and Setup
Full setup instructions are now located in **`docs/pheromind-v2-manual-setup-and-workflow.md`**. This document provides the definitive guide for configuring your project for the new V2 workflow.

## Vision for IDE and Self-Development
The goal is to enable this system to be used effectively within IDEs like Roo Code, Cline, Kilo Code, and TRAE AI IDE. This includes facilitating the repository's self-development, where the AI agents can analyze, modify, and improve their own codebase and operational parameters. Instructions and best practices for this are under development.

---
