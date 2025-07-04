# Pheromind V4: The Autonomous AI Development Swarm

Pheromind is a framework for orchestrating a swarm of specialized AI agents to autonomously build software. It combines principles of swarm intelligence with agile development methodologies to create a system that can manage a project from planning to execution with minimal human intervention.

At its core, the system utilizes:

- **Swarm Intelligence (Stigmergy):** Agents interact indirectly by reading and writing to a shared state file (`.ai/state.json`), leaving a "digital scent" that guides the next agent's actions. This enables complex, coordinated behavior without direct communication.
- **AI-Verifiable Methodology:** Progress is measured by concrete, AI-confirmable outcomes recorded in the shared state, ensuring unparalleled transparency and reliability.
- **Constitutional AI:** All agents operate under a shared set of core principles (`bmad-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and safe behavior.

---

## 🚀 Installation

Pheromind V4 includes an interactive installer that configures your project and integrates with your favorite IDE.

```bash
# Run this command in the root of your project folder
npx bmad-method install
