You're absolutely right to call me out on that repeated syntax error! My apologies. I'm still learning and will strive to be more careful. Thank you for your patience.

Let's get this right. Here are the detailed instructions for manual expansion pack usage and my recommendations for your next steps:

**How to Use Expansion Packs Manually**

Manual integration of expansion packs is necessary if you are not using the `bmad` installer or if you wish to deeply customize how expansion pack capabilities are made available to your AI agents. The primary goal is to ensure that your core AI agents (especially orchestrators like Olivia) or your development environment (like Roo Code or a Web UI) can correctly locate and utilize the agents, tasks, templates, checklists, and data provided by the expansion pack.

This guide uses the `bmad-smart-contract-dev` expansion pack as the primary example.

**Step 1: Ensure Expansion Pack is Present**

First, ensure the entire expansion pack directory (e.g., `expansion-packs/bmad-smart-contract-dev`) is present in your project. Typically, this would be at the root of your project, alongside your `bmad-core/` directory if you are maintaining that structure.

```
your-project-root/
├── bmad-core/
├── expansion-packs/
│   ├── bmad-smart-contract-dev/
│   │   ├── agents/
│   │   │   └── smart-contract-developer.md
│   │   ├── tasks/
│   │   │   └── develop-solidity-contract.md
│   │   ├── templates/
│   │   │   └── smart-contract-architecture-doc-tmpl.md
│   │   ├── checklists/
│   │   └── manifest.yml
│   └── ... (other expansion packs)
└── ... (your project files)
```

**Step 2: Integrating with an Orchestrator Agent (e.g., Olivia)**

This is the most common and recommended method for leveraging expansion packs. Your main orchestrator agent (e.g., `bmad-orchestrator.md` from `bmad-core`) needs to be made aware of the resources within the expansion pack.

1.  **Open the Orchestrator's Markdown File:**
    Locate your primary orchestrator agent file. For instance, `bmad-core/agents/bmad-orchestrator.md`.

2.  **Modify the `dependencies:` Section:**
    In the YAML frontmatter of the orchestrator's markdown file, find the `dependencies:` key. You will add paths to the specific agents, tasks, templates, etc., from the expansion pack.

    **Full, Copy-Pasteable Example for `bmad-core/agents/bmad-orchestrator.md`:**

    Let's assume your `bmad-orchestrator.md` has an existing `dependencies` section. You'll be adding new entries. If it doesn't have one, you can add the whole block.

    ```yaml
    # ... other parts of bmad-orchestrator.md YAML frontmatter ...

    dependencies:
      # --- Core BMAD Dependencies (examples, yours might differ) ---
      data:
        - bmad-core/data/bmad-kb.md
      utils:
        - bmad-core/utils/workflow-management.md
      # --- ADD EXPANSION PACK DEPENDENCIES BELOW ---
      agents: # Makes Olivia aware of new agent types she can dispatch to
        - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md
        - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-architect.md
        - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-auditor.md
        # Add other agents from the bmad-smart-contract-dev pack as needed
      tasks: # Tasks Olivia can assign or reference
        - bmad-core/tasks/create-doc.md # Example of an existing core task
        - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md
        - expansion-packs/bmad-smart-contract-dev/tasks/design-smart-contract-architecture.md
        - expansion-packs/bmad-smart-contract-dev/tasks/audit-smart-contract.md
        # Add other tasks from the bmad-smart-contract-dev pack
      templates: # Templates Olivia or other agents might use
        - bmad-core/templates/prd-tmpl.md # Example of an existing core template
        - expansion-packs/bmad-smart-contract-dev/templates/smart-contract-architecture-doc-tmpl.md
      checklists: # Checklists that might be used in workflows
        - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist.md
      # data: # If the expansion pack has its own specific knowledge bases
        # - expansion-packs/bmad-smart-contract-dev/data/solidity-best-practices.md
      # workflows: # If the expansion pack defines new top-level workflows
        # - expansion-packs/bmad-smart-contract-dev/workflows/new-dapp-workflow.yml

    # ... rest of bmad-orchestrator.md ...
    ```

3.  **How it Works:**
    When Olivia (the orchestrator) is loaded, her `dependencies` list informs her (and the underlying AI model) about the available specialized agents and the tasks they can perform. You can then instruct Olivia: *"We need a new smart contract designed for token staking. Please engage the SmartContractArchitect using the 'design-smart-contract-architecture' task and use the PRD at 'docs/project-prd.md' as input."* Olivia, now aware of the `SmartContractArchitect` and its associated task from the expansion pack, can coordinate this. The Stigmergic system (`.bmad-state.json`) will then track progress via signals generated by these agents.

**Step 3: Using Expansion Pack Agents Directly in a Web UI (Manual Bundle Creation)**

If you're using a Web UI that accepts single text file bundles for agents and you're not using an installer, you'll need to manually create this bundle.

1.  **Identify the Agent:** Choose the agent from the expansion pack, e.g., `expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md`.

2.  **Gather Agent's Full Content:** Copy the entire content of the agent's markdown file.

3.  **Gather Content of Dependencies:**
    Look at the `dependencies:` section within the *chosen agent's* YAML frontmatter (e.g., `smart-contract-developer.md`). You must include the full content of every file listed there.

    For example, if `smart-contract-developer.md` lists:
    ```yaml
    dependencies:
      tasks:
        - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md
      data:
        - bmad-core/data/bmad-kb.md
    ```
    You need to get the full text of `develop-solidity-contract.md` and `bmad-kb.md`.

4.  **Concatenate into a Single `.txt` File:**
    Create a new text file (e.g., `sc-dev-bundle.txt`). Paste the content of the main agent file first, then the content of each dependency file. It's crucial to use clear markers to separate the content of different files so the AI can distinguish them.

    **Full, Copy-Pasteable Snippet Illustrating Bundle Structure:**

    ```text
    <<<<< START OF FILE: expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md >>>>>
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
        - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md
      checklists:
        # - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist.md
      data:
        - bmad-core/data/bmad-kb.md
        # - expansion-packs/bmad-smart-contract-dev/data/solidity-best-practices-kb.md
    ```
    <<<<< END OF FILE: expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md >>>>>

    <<<<< START OF FILE: expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md >>>>>
    # Task: Develop Solidity Smart Contract

    **Objective:** To write, compile, and perform basic unit testing for a Solidity smart contract based on its architectural design and detailed specifications.

    # ... (rest of the content of develop-solidity-contract.md) ...

    ---
    <<<<< END OF FILE: expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md >>>>>

    <<<<< START OF FILE: bmad-core/data/bmad-kb.md >>>>>
    # BMAD Knowledge Base

    This document contains general knowledge about the BMAD (Better Mjolnir Agent Development) framework.

    # ... (rest of the content of bmad-kb.md) ...

    ---
    <<<<< END OF FILE: bmad-core/data/bmad-kb.md >>>>>

    ```

    *Note on Context Limits:* Be very mindful of the AI model's context window size. Including many large dependency files can exceed this limit or degrade performance. Only include essential dependencies for the agent's direct operation.

**Step 4: Using Expansion Pack Agents Directly in an IDE (e.g., Roo Code with `.roomodes`)**

If your IDE supports custom agent definitions (like Roo Code's `.roomodes` file, often found at the project root or in a `.vscode/` or `.roo/` directory), you can add expansion pack agents manually.

1.  **Open IDE Agent Configuration File:** For Roo Code, this is typically `.roomodes` or `roomodes.json` or `roomodes.yml` depending on the version and setup. The example below uses YAML format, which is common.

2.  **Add a New `customModes` Entry:**
    You will add a new item to the `customModes` list. The most critical part is the `customInstructions` field, which must contain the *entire markdown content* of the agent file from the expansion pack.

    **Full, Copy-Pasteable Example for a `.roomodes` (YAML format) file:**

    ```yaml
    customModes:
      # ... other existing modes for bmad-core agents ...
      - slug: bmad-smart-contract-developer-manual # Must be unique
        name: '📜 Smart Contract Developer (SC-Pack)'
        roleDefinition: "Expert Smart Contract Developer proficient in Solidity and secure development practices."
        whenToUse: "For writing, testing, and debugging smart contracts based on specifications, from the SC-Dev Pack."
        # The customInstructions field contains the ENTIRE content of the agent's .md file
        customInstructions: |
          # smart-contract-developer

          CRITICAL: Read the full YML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:

          ```yml
          agent:
            name: SCDeveloper
            id: smart-contract-developer # This ID is from the file, used internally by the agent
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

          dependencies: # These paths are for the AI's awareness; actual file content isn't auto-loaded by this .roomodes entry alone
            tasks:
              - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md
            checklists:
              # - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist.md
            data:
              - bmad-core/data/bmad-kb.md # General BMAD knowledge
              # - expansion-packs/bmad-smart-contract-dev/data/solidity-best-practices-kb.md
          ```
        groups: # Define permissions for the agent in the IDE
          - read
          - edit
          - execute # If the IDE allows execution of commands/tools
        source: project # Typically 'project' for manually added modes
    ```

3.  **Understanding Dependencies in `.roomodes`:**
    When you include the agent's full markdown in `customInstructions`, the AI model itself parses the `dependencies` section within that markdown. The IDE doesn't automatically load these dependency files into the context based on the `.roomodes` entry alone. The AI agent, upon interpreting its own dependencies, might then:
    *   Know it *can* perform a certain task (if the task file was part of its core training or similar).
    *   Ask the user to provide the content of a specific task or data file when it needs it.
    *   If the IDE has advanced features, it might offer to load these dependencies into context upon request.

**Step 5: Key Considerations for Manual Use**

*   **Path Resolution:** Paths in `dependencies` sections (e.g., `expansion-packs/bmad-smart-contract-dev/tasks/some-task.md`) are relative to the project root. Ensure these paths are correct for your project structure.
*   **Context Window Limits:** As mentioned, AI models have context limits. Loading too many dependencies or very large ones (especially in Web UI bundles) can exceed these limits or impair performance. Be selective.
*   **Modularity:** Expansion packs aim for modularity. When integrating, try to give agents access only to what they genuinely need from an expansion. The orchestrator (Olivia) plays a key role here by dispatching tasks to specialized agents who have their own focused set of dependencies.
*   **Workflows:** If your expansion pack defines new workflows (e.g., a `.yml` file in its `workflows/` directory), you'll need to update your main orchestrator agent (Olivia) to be aware of these. This usually involves adding the workflow file to Olivia's `dependencies: workflows:` list and potentially modifying her `core_principles` to know when to initiate or refer to these expansion pack workflows.
*   **Agent Reporting for Stigmergy:** Ensure that agents from expansion packs are prompted to produce clear reports that the Scribe agent (Saul) can parse to update the `.bmad-state.json`. This is crucial for the expansion pack to participate in the broader autonomous system. For example, a `SmartContractDeveloper` should report successes or failures in a way that Saul can translate into signals like `smart_contract_coded` or `smart_contract_tests_failed`.

By following these detailed steps, you can manually integrate BMAD expansion packs into your project and leverage their specialized AI capabilities.

**Recommended Next Steps to Build and Integrate Effective Expansion Packs**

With the BMAD V2 core system now featuring a more robust stigmergic system (`.bmad-state.json` managed by Saul and leveraged by Olivia), integrating and developing effective expansion packs involves aligning with these core capabilities. The goal is to create specialized agents and resources that seamlessly extend the autonomous capabilities of the overall AI coding system.

1.  **Design Expansion Pack Agents for Stigmergic Collaboration:**
    *   **Reporting for Saul:** When defining `core_principles` for your expansion pack agents, ensure they are prompted to produce clear, structured reports upon task completion or when encountering issues. These reports should be easily parsable by the Scribe agent (Saul). For example, a `GameDeveloper` agent completing a level design task should report its success and the path to the level design document, allowing Saul to generate a `level_designed` signal and update `project_documents`. Similarly, failures should be reported in a way that Saul can translate into appropriate `problem` signals (e.g., `asset_creation_failed`, `smart_contract_test_failed`).
    *   **Responding to Olivia:** Expansion pack agents will typically be dispatched by Olivia based on the overall project state and active signals. Ensure their `startup` instructions and `commands` are clear for receiving tasks from an orchestrator. They should be prepared to act on specific inputs provided by Olivia (e.g., paths to PRDs, architecture documents, or specific data).
    *   **Signal Awareness (Conceptual):** While individual agents don't directly read `.bmad-state.json`, design their capabilities considering the types of signals (defined in Saul's `swarmConfig`) they might implicitly trigger or that might lead to them being tasked. For instance, an `InfraProvisioning` agent's successful run should clearly state what was provisioned so Saul can signal `infra_provisioned`.

2.  **Deepen Agent Prompts & Specialization:**
    *   This remains a critical, iterative process for any expansion pack. For each agent in your pack (e.g., `SmartContractAuditor`, `GameDesigner`, `DevOpsEngineer`):
        *   Develop comprehensive `core_principles` that truly define their expertise and guide their decision-making within their specialized domain.
        *   Refine `startup` instructions for clear initialization when invoked.
        *   Detail specific `commands` they can execute relevant to their role.
        *   Meticulously list their `dependencies` on tasks, templates, checklists, and data files *within their own expansion pack* and from `bmad-core` where necessary (e.g., core data files like `bmad-kb.md` or core tasks like `create-doc`).
    *   **Self-Development Approach:** Leverage your core BMAD agents (like Analyst or PM, or even a dedicated `PromptEngineer` agent) to help design and refine prompts for new expansion pack agents. For example: *"Analyze the role of a 'GameNarrativeDesigner'. Propose five core principles, three key commands, and list typical tasks and templates it would depend on within a game development expansion pack."*

3.  **Define Custom Tasks, Templates, and Knowledge Bases:**
    *   **Tasks:** For each significant capability an expansion pack agent offers, define a detailed task file (e.g., `expansion-packs/my-game-exp/tasks/create-character-backstory.md`). These tasks should clearly outline objectives, inputs, a step-by-step process for the agent, and expected outputs/reports. These task files are crucial for the agent's own understanding and for Olivia to know how to properly dispatch to them.
    *   **Templates:** Create high-quality templates for common documents your expansion pack agents will produce (e.g., `game-design-doc-tmpl.md`, `security-audit-report-tmpl.md`, `deployment-plan-tmpl.md`).
    *   **Knowledge Bases (`data/`):** Develop specialized knowledge base files (`.md`) within your expansion pack's `data/` directory. These should contain domain-specific information, best practices, checklists, or reference material that your specialized agents need (e.g., `solidity-common-vulnerabilities.md`, `phaser-js-cheatsheet.md`). Ensure these are listed in the relevant agents' `dependencies`.

4.  **Test Expansion Pack Agent Invocation (Manual & Orchestrated):**
    *   **Direct Invocation:** Once an expansion pack agent (e.g., `SmartContractDeveloper`) has a reasonably developed prompt and its dependencies are in place, test it directly. If using an IDE like Roo Code, add its mode manually (as described in "How to Use Expansion Packs Manually") and give it a simple, representative task. Observe its output, how it uses its dependencies (or asks for them), and refine its prompt and supporting files.
    *   **Orchestrated Invocation:** After direct testing, integrate the expansion pack with your orchestrator (Olivia) by adding its resources to Olivia's dependencies. Then, task Olivia with a goal that requires the specialized agent. For example: *"Olivia, we need to develop a 'HelloWorld' Solidity contract. Please coordinate this."* Observe if Olivia correctly dispatches to the `SmartContractDeveloper`, if the developer performs the task, and if its report to Saul generates the correct signals in `.bmad-state.json`. This tests the end-to-end integration into the stigmergic system.

5.  **Consider New Workflows (Optional):**
    *   If your expansion pack introduces a complex, multi-step process that doesn't fit neatly into existing core workflows, you can define a new workflow YAML file within your expansion pack's `workflows/` directory.
    *   To make this usable, Olivia (or another relevant orchestrator/coordinating agent) would need to be made aware of this workflow, typically by adding it to her `dependencies: workflows:` list. Her `core_principles` might also need updating to understand when and how to initiate or reference this new workflow.

By focusing on these areas, you can create powerful BMAD expansion packs that not only provide specialized AI capabilities but also integrate effectively into the collaborative, state-driven intelligence of the BMAD V2 ecosystem. This iterative process of defining agent roles, detailing their knowledge and tasks, and testing their interaction with the core system is key to building a highly autonomous and capable AI development workforce.
