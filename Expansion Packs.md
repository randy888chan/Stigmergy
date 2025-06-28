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
* The Orchestrator (Olivia) reads this signal. Because you'veadded the expansion pack agents to her `dependencies`, she now knows that the `smart-contract-architect` is the specialist for this task.
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
      - 'SWARM_INTEGRATION: I must follow the reporting and handoff procedures defined in the project''s AGENTS.md document. My task is not complete until I have reported a detailed natural language summary to the Scribe or supervising Orchestrator, enabling the autonomous loop.'
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
