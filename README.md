# Pheromind: An AI Coding System

At its core, this system utilizes:

- **Swarm Intelligence (Stigmergy):** Agents interact indirectly through a shared, dynamic information medium – their "digital scent." This allows for emergent coordination, dynamic task allocation, and robust problem-solving without centralized bottlenecks.
- **AI-Verifiable Methodology:** Progress is not just about completing tasks; it's about achieving **concrete, measurable, and AI-confirmable outcomes.** This ensures unparalleled transparency and reliability throughout the project lifecycle.
- **Natural Language Driven Coordination:** Our innovative system enables AI agents to interpret and act upon rich, nuanced information, fostering a level of sophisticated collaboration previously unattainable in automated systems.

Pheromind stands apart by offering a unique combination of capabilities:

- **🚀 True Autonomous Orchestration:** Beyond simple scripting, AI agents take the lead in planning, delegating, and executing complex project phases with minimal human intervention required for the core workflow.
- **🧠 Adaptive Swarm Intelligence:** Like a natural swarm, Pheromind is inherently resilient and adaptive. The collective can dynamically reallocate resources, navigate unforeseen obstacles, and optimize pathways to project goals.
- **🎯 Unambiguous AI-Verifiable Outcomes:** We move beyond subjective progress reports. The system is architected to ensure that milestones are defined by outputs and states that can be programmatically verified by AI, bringing mathematical rigor to project tracking.
- **🗣️ Sophisticated Natural Language Interpretation:** Agents communicate and coordinate based on the interpretation of complex, narrative-style information, allowing for a richer and more flexible flow of understanding than rigid, predefined commands. This enables the swarm to react to nuanced updates and maintain a human-auditable trail of understanding.

Imagine an environment where:

- You define a high-level goal or user blueprint.
- A swarm of AI agents autonomously designs, codes, tests, and documents the software, adhering to best practices and your specific requirements.
- Progress is continuously verified, and the system adapts to challenges in real-time.
- Human developers transition to roles of high-level strategists, creative problem-solvers, and reviewers, amplified by an intelligent AI workforce.

This repository is adapted from the [BMAD-Method](https://github.com/bmadcode/BMAD-METHOD.git) and combines it with the content of the `ph/` folder to realize the vision described above.

## 🚀 Quick Start

1.  **Define Your Vision:** Use the `ph/PlanIdeaGenerator.md` template to describe your software idea in plain English. This "Zero-Code User Blueprint" is the starting point for the AI agent swarm.
2.  **Process with Agents:**
    *   The blueprint can then be transformed into a Product Requirements Document (PRD) using the process outlined in `ph/PlanIdeaToFullPRD.md`.
    *   Subsequently, the AI agents defined in `bmad-core/agents/` will use this PRD to design, develop, and test the software.

### Using Pre-Built Agent Bundles (Web UI)

For interacting with agent teams or individual agents through web-based AI platforms (like Gemini, ChatGPT, etc.):

1.  **Get the bundle**: Bundles are located in the `dist/` directory. For a full team, you might start with `dist/teams/team-fullstack.txt`.
2.  **Upload & Configure**: Upload the chosen `.txt` file to your AI platform and provide a basic instruction like: "Your critical operating instructions are attached, do not break character as directed."
3.  **Interact**: Begin your conversation with the AI. You can often type `*help` or `/help` to see available commands or switch between agents (e.g., `*pm`, `*architect`).

## Available Agents

The system utilizes a suite of specialized AI agents. Key roles include:

| Agent               | Role               | Core Responsibilities                         |
| ------------------- | ------------------ | --------------------------------------------- |
| `analyst`           | Business Analyst   | Market analysis, brainstorming, project brief |
| `pm`                | Product Manager    | Product strategy, roadmaps, PRDs              |
| `architect`         | Solution Architect | System design, technical architecture         |
| `dev`               | Developer          | Code implementation                           |
| `qa`                | QA Specialist      | Testing strategies, quality assurance         |
| `ux-expert`         | UX Designer        | User experience, UI design                    |
| `po`                | Product Owner      | Backlog management, story validation          |
| `sm`                | Scrum Master       | Sprint planning, story creation               |
| `bmad-orchestrator` | Team Coordinator   | Multi-agent workflows, role switching         |
| `bmad-master`       | Universal Expert   | Access to all capabilities without switching  |

*(This list may be expanded with specialized agents, e.g., for blockchain development, as the system evolves.)*

## Project Structure Overview

```plaintext
ph/                  # Core documents for initiating and guiding the AI system
├── AI Coding System Goal.md
├── PlanIdeaGenerator.md
├── PlanIdeaToFullPRD.md
└── ... (other conceptual and process documents)

bmad-core/           # The "brain" of the AI agents
├── agents/          # Individual agent definitions (prompts, capabilities)
├── agent-teams/     # Configurations for teams of agents
├── workflows/       # Definitions of development processes
├── templates/       # Document templates (e.g., for PRDs, architecture)
├── tasks/           # Definitions of reusable tasks for agents
├── checklists/      # Quality assurance checklists
└── data/            # Knowledge bases and core data for agents

dist/                # Pre-built bundles for use in Web UIs
├── agents/          # Bundles for individual agents
└── teams/           # Bundles for pre-configured agent teams

expansion-packs/     # Optional add-ons for specialized domains (e.g., game dev, DevOps)

tools/               # Utilities for building bundles and managing the system
├── builders/
└── installer/       # Original installer (functionality for this repo TBD)

docs/                # Minimal documentation
└── pheromind-v2-manual-setup-and-workflow.md # Manual setup (to be reviewed)
```

## Installation and Setup

*   **Web UI**: Use the pre-built bundles in `dist/` as described in the Quick Start.
*   **IDE / Local Usage**: The original `npx bmad-method install` script from BMAD-Method is present in `tools/installer`. Its adaptation and functionality for this specific repository will be reviewed. For now, manual setup as described in `docs/pheromind-v2-manual-setup-and-workflow.md` might provide guidance, though this document also needs review in the context of the new system.

## Vision for IDE and Self-Development

The goal is to enable this system to be used effectively within IDEs like Roo Code, Cline, Kilo Code, and TRAE AI IDE. This includes facilitating the repository's self-development, where the AI agents can analyze, modify, and improve their own codebase and operational parameters. Instructions and best practices for this are under development.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Original Author (BMAD-Method)

Brian (BMad) Madison
