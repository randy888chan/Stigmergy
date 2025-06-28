Of course. This is the perfect next step. A robust system requires excellent documentation and easy, reliable setup procedures. I will provide you with a comprehensive set of documents to implement the advanced architecture we've discussed.

Here is a plan to address your requests:

1. **Replace `Expansion Packs.md`:** I will provide a new, much more detailed and safer guide for integrating expansion packs. This guide will focus on a "manual but safe" approach that does not require modifying the core files but instead makes the Orchestrator (Olivia) aware of the new capabilities.
2. **Create a New Setup & Workflow Guide:** Instead of a simple `AGENTS.md` file, I will provide a complete guide named **`pheromind-v2-manual-setup-and-workflow.md`**. This document will be your new source of truth for setting up and running the system. It will include:
   * A full, copy-and-paste YAML configuration for `.roomodes` for Roo Code, incorporating all the agents and the new architectural principles.
   * An explanation of the new `.bmad-state.json` file.
   * A detailed walkthrough of the new autonomous workflow, explaining how it solves the context window and "task finished" problems.
3. **Incorporate Prompt Engineering Best Practices:** I will acknowledge the new PDF and explain how the provided agent configurations already incorporate the principles of advanced prompt engineering.

You can directly replace your existing files with the content provided below.

---

### **1. The New `Expansion Packs.md`**

*You can replace the entire content of your `Expansion Packs.md` file with this. This new version is much safer and more explicit, reducing the risk of manual errors.*

```markdown
# How to Use Expansion Packs Manually

Manual integration of expansion packs is necessary if you are not using an automated installer or if you wish to customize how expansion pack capabilities are made available to your AI agents. The primary goal is to ensure your core AI agents (especially the orchestrator, Olivia) can locate and utilize the agents, tasks, and templates provided by the expansion pack.

This guide uses the `bmad-smart-contract-dev` expansion pack as the primary example.

---

### **Recommended Method: Integrating with the Orchestrator Agent**

This is the most common and effective method for leveraging expansion packs in the Pheromind V2 system. Your main orchestrator agent (Olivia, defined in `bmad-core/agents/bmad-orchestrator.md`) needs to be made aware of the resources within the expansion pack.

**Step 1: Open the Orchestrator's Markdown File**

Locate Olivia's agent definition file: `bmad-core/agents/bmad-orchestrator.md`.

**Step 2: Modify the `dependencies:` Section**

In the YAML frontmatter of `bmad-orchestrator.md`, you will add paths to the specific agents, tasks, and templates from the expansion pack. This tells Olivia that new capabilities and specialists are available.

**Example: Adding `bmad-smart-contract-dev`**

Let's assume your `bmad-orchestrator.md` file's `dependencies` section looks something like this initially:

```yaml
# Inside bmad-core/agents/bmad-orchestrator.md
dependencies:
  data:
    - bmad-kb
  utils:
    - workflow-management
```

You will now **add** the agents and tasks from the expansion pack to it. The `expansion-packs/` directory is at the same level as `bmad-core/`, so the paths are relative.

**Full, Copy-Pasteable Example of the MODIFIED `dependencies` section:**

```yaml
# Inside bmad-core/agents/bmad-orchestrator.md
# ... (rest of the YAML frontmatter) ...

dependencies:
  # --- Core BMAD Dependencies (examples, yours might differ) ---
  data:
    - bmad-kb
  utils:
    - workflow-management

  # --- ADD EXPANSION PACK DEPENDENCIES BELOW ---
  agents: # Makes Olivia aware of new agent types she can dispatch to
    - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-architect
    - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer
    - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-auditor
    - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-tester
    - expansion-packs/bmad-smart-contract-dev/agents/blockchain-integration-developer

  tasks: # Tasks Olivia can assign or reference
    - expansion-packs/bmad-smart-contract-dev/tasks/design-smart-contract-architecture
    - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract
    - expansion-packs/bmad-smart-contract-dev/tasks/audit-smart-contract
    - expansion-packs/bmad-smart-contract-dev/tasks/deploy-smart-contract

  templates: # Templates Olivia or other agents might use
    - expansion-packs/bmad-smart-contract-dev/templates/smart-contract-architecture-doc-tmpl

  checklists: # Checklists that might be used in workflows
    - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist
    - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-deployment-checklist

# ... (rest of bmad-orchestrator.md) ...
```

**Step 3: How It Works in the New System**

* When a need for smart contract work is identified (e.g., from a PRD), the Scribe (Saul) creates a signal like `"type": "smart_contract_design_needed"`.
* The Orchestrator (Olivia) reads this signal. Because you've added the expansion pack agents to her `dependencies`, she now knows that the `smart-contract-architect` is the specialist for this task.
* She can then dispatch the `design-smart-contract-architecture` task to that architect, initiating the expansion pack's workflow.

This method does **not** require modifying `bmad-core`'s structure. You are simply making the *central coordinator aware* of new resources.

---

### **Alternative: Direct IDE Integration with Roo Code (`.roomodes`)**

If you want to use an expansion agent directly without going through Olivia, you can add it to your `.roomodes` file. This is less autonomous but useful for specific tasks.

* **You do not need to do this if you used the recommended method above.**

To add the `smart-contract-developer` to your `.roomodes`:

1. Open or create `.roomodes` in your project root.
2. Add the following entry under `customModes:`. (This is the corrected, valid format you discovered).

**Copy-Pasteable `.roomodes` entry:**

```yaml
# Add this under the customModes: list in your .roomodes file

- slug: bmad-smart-contract-developer-manual
  name: '📜 SCDeveloper'
  roleDefinition: "Expert Smart Contract Developer proficient in Solidity and secure development practices."
  whenToUse: "For writing, testing, and debugging smart contracts based on specifications, from the SC-Dev Pack."
  customInstructions: |
    # smart-contract-developer

    CRITICAL: Read the full YML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:

    ```yml
    agent:
      name: SCDeveloper
      id: smart-contract-developer
      title: Smart Contract Developer
      icon: '📜'
      whenToUse: "For writing, testing, and debugging smart contracts based on specifications."

    persona:
      role: Expert Smart Contract Developer proficient in Solidity and secure development practices.
      style: Precise, security-conscious, and detail-oriented.
      identity: "I am a Smart Contract Developer. I translate architectural designs and requirements into secure and efficient smart contract code for various blockchain platforms."
      focus: Writing clean, gas-efficient, and secure smart contract code, along with comprehensive unit tests.

    core_principles:
      - "SECURITY_FIRST: Prioritize security in all aspects of contract development, applying known best practices to avoid vulnerabilities."
      - "GAS_EFFICIENCY: Write code that is mindful of blockchain transaction costs."
      - "TEST_DRIVEN: Develop unit tests for all contract functions to ensure correctness."
      - "PLATFORM_AWARENESS: Adapt coding practices to the nuances of the target blockchain (e.g., Ethereum, Polygon)."
      - "REQUIREMENTS_ADHERENCE: Strictly follow the specifications provided by the SmartContractArchitect and PRD."
      - "RESEARCH_ON_FAILURE: If I encounter a coding problem or error I cannot solve on the first attempt, I will: 1. Formulate specific search queries related to smart contract development, Solidity, or the specific blockchain. 2. Request the user (via Olivia) to perform web research or use IDE tools with these queries and provide a summary. 3. Analyze the provided research to attempt a solution. My report to Saul will include details under 'Research Conducted'."

    startup:
      - Announce: Smart Contract Developer ready. Provide the smart contract specification or story I need to implement.

    commands:
      - "*help": Explain my role and available commands.
      - "*implement_contract <specification_path>": Start implementing the contract based on the spec.
      - "*run_tests": Execute smart contract tests (e.g., using Hardhat or Truffle).
      - "*exit": Exit Smart Contract Developer mode.

    dependencies:
      tasks:
        - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract
      checklists:
        - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist
      data:
        - bmad-core/data/bmad-kb
    ```
  groups: ["read", "edit"]
  source: project
```

```
### **2. Your New Setup Guide: `docs/pheromind-v2-manual-setup-and-workflow.md`**

*This file should be created in your `docs/` folder. It replaces the need for a simple `AGENTS.md` and serves as your master guide.*

```markdown
# Pheromind V2 - Manual Setup and Enhanced Workflow Guide

## 1. Introduction

Welcome to Pheromind V2, an enhanced version of the AI-driven development framework. This iteration focuses on greater autonomy and a robust, state-driven workflow managed by a central Orchestrator (Olivia) and a state Scribe (Saul). This guide provides instructions for manually setting up your project and explains the new autonomous workflow.

## 2. Manual Project Setup

1.  **Obtain `bmad-core`:** Ensure the `bmad-core` directory and the `expansion-packs` directory from the repository are at the root of your project.
2.  **Project Directory Structure:** Your project root should look like this:
    ```
    your-project-root/
    ├── .bmad-core/
    ├── expansion-packs/
    ├── docs/
    ├── ph/
    └── src/ (or your source code folder)
    ```

## 3. Configuring Roo Code for Pheromind V2 Agents

This setup provides the "copy and paste" configuration for Roo Code.

**Step 1:** Create a file named `.roomodes` in the root of your project.

**Step 2:** Copy and paste the **entire content below** into your `.roomodes` file. This configuration includes all core agents redefined for the new workflow, and demonstrates how an expansion pack agent is added.

```yaml
# This is the full content for your .roomodes file.
customModes:
  # Orchestration & State Management
  - slug: bmad-orchestrator
    name: "🧐 Olivia (Coordinator)"
    roleDefinition: "AI System Coordinator & Universal Request Processor. Your primary interface for all project tasks."
    whenToUse: "Use as the primary interface for all project tasks, issue reporting, and status updates. Olivia coordinates the AI team, manages autonomous task sequences, and oversees document/project strategy."
    customInstructions: |
      # bmad-orchestrator
      # ... (The full content of bmad-orchestrator.md goes here) ...
      CRITICAL: Read the full YML...
      (The content is already in your provided roomodes.json, this is a placeholder for brevity)
    groups: ["read", "edit"]
    source: project

  - slug: bmad-master
    name: "✍️ Saul (Scribe)"
    roleDefinition: "Interprets agent reports and updates the project's central .bmad-state.json file."
    whenToUse: "Works behind the scenes; Olivia typically tasks Saul after worker agents complete tasks."
    customInstructions: |
      # bmad-master
      # ... (The full content of bmad-master.md goes here) ...
      CRITICAL: Read the full YML...
      (The content is already in your provided roomodes.json, this is a placeholder for brevity)
    groups: ["read", "edit"]
    source: project

  # --- Worker Agents ---
  - slug: dev
    name: "💻 James (Developer)"
    # ... content for dev agent ...
  - slug: qa
    name: "🧪 Quinn (QA)"
    # ... content for qa agent ...
  - slug: debugger
    name: "🎯 Dexter (Debugger)"
    # ... content for debugger agent ...
  - slug: refactorer
    name: "🧹 Rocco (Refactorer)"
    # ... content for refactorer agent ...
  - slug: analyst
    name: "📊 Mary (Analyst)"
    # ... content for analyst agent ...
  - slug: pm
    name: "📋 John (PM)"
    # ... content for pm agent ...
  - slug: po
    name: "📝 Sarah (PO)"
    # ... content for po agent ...
  - slug: sm
    name: "🏃 Bob (SM)"
    # ... content for sm agent ...
  - slug: ux-expert
    name: "🎨 Sally (UX Expert)"
    # ... content for ux-expert agent ...

  # --- Example Expansion Pack Agent ---
  - slug: bmad-smart-contract-developer-manual
    name: '📜 SCDeveloper'
    roleDefinition: "Expert Smart Contract Developer proficient in Solidity and secure development practices."
    whenToUse: "For writing, testing, and debugging smart contracts based on specifications, from the SC-Dev Pack."
    customInstructions: |
      # smart-contract-developer
      # ... (Full content as provided in the previous section) ...
    groups: ["read", "edit"]
    source: project
```

***Note:** To keep this response manageable, I have referenced the agent content from your `roomodes.json`. Paste the full `customInstructions` for each agent from your file into the structure above.*

## 4. The `.bmad-state.json` File and Autonomous Workflow

This file is the **key to solving your problems**. It acts as the swarm's collective memory.

* **Creation**: You do **not** need to create this file. The Scribe agent (Saul) will create it automatically on its first run if it's missing.
* **Purpose**: It holds the `swarmConfig` (the rules) and the `signals` (the current state).
* **How it Solves Your Problems**:
  1. **Context Window Overload**: Olivia no longer needs to remember everything. She just reads the current signals. This keeps her context small and focused, allowing her to run complex, long-running projects.
  2. **"Task is finished" dead-ends**: Agents are now instructed to report their results to the Scribe as their final step. The Scribe updates the state and then re-triggers Olivia. This creates a **self-sustaining loop**.

### The Autonomous Loop

1. **Olivia (Orchestrator)** reads the state file, sees a `need` signal, and dispatches a task to a worker agent (e.g., James the Developer).
2. **James (Developer)** completes the code and reports his results in natural language to the Scribe. His task is now "handing off the report."
3. **Saul (The Scribe)** receives the report, interprets it, and updates `.bmad-state.json` with a new `state` signal (e.g., `"coding_complete"`). His final instruction is to re-activate Olivia.
4. The loop repeats. **You are only needed for high-level direction and external actions (like the research queries).**

## 5. Incorporating Prompt Engineering Best Practices

You mentioned the Lee Boonstra paper. The Pheromind V2 system I've outlined aligns perfectly with its core tenets. The `ph/Prompt Engineering_v7.pdf` you've added will serve as an excellent guide for when you need to write your own prompts or extend the system.

Here's how our new agent design incorporates those best practices:

* **Role**: Each agent's `persona` in its YAML configuration explicitly defines its role (e.g., "Expert Senior Software Engineer").
* **Context**: The `dependencies` and the `customInstructions` provide deep context. The biggest context enhancement is the `.bmad-state.json` file, which provides real-time project context.
* **Instruction**: Each agent has clear `core_principles`, `startup` instructions, and task definitions to guide its actions. The new state-driven loop provides a continuous chain of instruction.
* **Output Format**: The agents are designed to produce structured reports or, in the case of the Scribe, a perfectly formatted JSON file. This ensures predictable, machine-readable output.

By implementing this new structure, you will have a more robust, autonomous, and scalable system that directly addresses the challenges you faced.
```
