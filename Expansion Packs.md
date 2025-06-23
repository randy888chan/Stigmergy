You're absolutely right to call me out on that repeated syntax error! My apologies. I'm still learning and will strive to be more careful. Thank you for your patience.

Let's get this right. Here are the detailed instructions for manual expansion pack usage and my recommendations for your next steps:

**How to Use Expansion Packs Manually**

Manual integration of expansion packs is useful if you're not using the installer or if you want to deeply customize how they are integrated into your project or a specific AI agent's context. The core idea is to make the AI agent aware of the specific agents, tasks, templates, checklists, and data within an expansion pack.

Let's use the `bmad-smart-contract-dev` expansion pack as an example.

1. **Copy the Expansion Pack Directory:**
   
   - Ensure the entire `expansion-packs/bmad-smart-contract-dev` directory is present in your project. Typically, this would be at the root of your project, alongside `bmad-core/` if you are maintaining that structure.

2. **Integrating with an Orchestrator/Master Agent (Web UI or IDE):**
   
   - This is the most common method if you want a central agent (like `bmad-orchestrator` or `bmad-master`) to manage the overall workflow and delegate tasks to specialized agents from the expansion pack.
   
   - **Modify the Orchestrator's Dependencies:**
     
     - Open the orchestrator agent's markdown file (e.g., `bmad-core/agents/bmad-orchestrator.md`).
     
     - Locate the `dependencies:` section in its YAML frontmatter.
     
     - You need to explicitly list the paths to the agents, tasks, templates, checklists, and data files from the expansion pack that this orchestrator should be aware of.
     
     - **Example modification for `bmad-core/agents/bmad-orchestrator.md`:**
       
       ```
       # ... other orchestrator configurations ...
       dependencies:
        agents: # Make orchestrator aware of new agent types
          - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md
          - expansion-packs/bmad-smart-contract-dev/agents/smart-contract-architect.md
          # ... add other smart contract agents from the pack
        tasks:
          - bmad-core/tasks/create-doc.md # existing core task
          - expansion-packs/bmad-smart-contract-dev/tasks/design-smart-contract-architecture.md
          - expansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md
          # ... add other relevant tasks from the smart contract pack
        templates:
          - bmad-core/templates/prd-tmpl.md # existing core template
          - expansion-packs/bmad-smart-contract-dev/templates/smart-contract-architecture-doc-tmpl.md
        checklists:
          - expansion-packs/bmad-smart-contract-dev/checklists/smart-contract-security-checklist.md
        data:
          - bmad-core/data/bmad-kb.md
          # - expansion-packs/bmad-smart-contract-dev/data/solidity-best-practices-kb.md # if you create this
        workflows:
          - bmad-core/workflows/greenfield-fullstack.yml
          # - expansion-packs/bmad-smart-contract-dev/workflows/greenfield-dapp.yml # if you create this
       # ... rest of the orchestrator config ...
       ```
   
   - **How it works:** When this orchestrator agent is loaded (either via a bundle in a Web UI or through an IDE that reads its definition), it "knows" about these linked resources. You can then instruct it, for example: "*We need to design a smart contract. Please engage the SmartContractArchitect using the 'design-smart-contract-architecture' task and the PRD at 'docs/my_project_prd.md'.*" The orchestrator, having the `SmartContractArchitect` and its task in its dependencies, can then manage this.

3. **Using Expansion Pack Agents Directly (Web UI or IDE without installer):**
   
   - If you want to interact directly with an agent from an expansion pack (e.g., `smart-contract-developer`):
     
     - **Web UI:** You would need to create a text bundle. This bundle must contain:
       
       1. The entire content of the agent's markdown file (e.g., `expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md`).
       2. The entire content of *every file* listed in that agent's `dependencies` section (tasks, templates, data files, etc.). You would manually concatenate these into a single `.txt` file, usually with clear markers indicating the start and end of each original file's content.
     
     - **IDE (e.g., Roo Code, if `.roomodes` is not updated by the installer):**
       
       1. Open your IDE's agent configuration file (e.g., `.roomodes` in the project root).
       2. Manually add a new entry for the expansion pack agent. The crucial part is the `customInstructions` field, which should contain the *entire markdown content* of the agent file (e.g., `expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md`).
       
       ```
       customModes:
        # ... other existing modes ...
        - slug: bmad-sc-dev # A unique slug for this agent
          name: '📜 Smart Contract Developer (Custom)'
          roleDefinition: "Expert Smart Contract Developer proficient in Solidity..."
          whenToUse: "For writing, testing, and debugging smart contracts..."
          customInstructions: |
            # smart-contract-developer (from expansion pack)
            CRITICAL: Read the full YML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:
            ```yml
            agent:
              name: SCDeveloper
              id: smart-contract-developer
              # ... rest of the YAML from smart-contract-developer.md ...
            ```
            # ... rest of the markdown content from smart-contract-developer.md ...
          groups:
            - read
            - edit # Or more specific permissions as needed
       ```
       
       *Note*: For this direct IDE use, if the agent's `customInstructions` (its full markdown) lists dependencies, the AI model itself will interpret those. The IDE doesn't necessarily need to load those dependency files separately if the agent's prompt is self-contained or instructs the user to provide that content when needed.

4. **Understanding Path Resolution:**
   
   - When an agent's markdown file refers to `dependencies` (like tasks or templates), these paths (e.g., `expansion-packs/bmad-smart-contract-dev/tasks/some-task.md`) are primarily for the AI's understanding of its capabilities and for tools like the `web-builder.js` or the installer to correctly bundle or locate files.
   - If you're creating bundles manually for Web UIs, you are effectively resolving these dependencies by including their content directly in the bundle.
   - For IDEs using the `customInstructions` method with full agent markdown, the AI model parses the YAML within that instruction to understand its own dependencies. The AI might then ask you to provide the content of a specific task file if it needs it.

5. **Key Considerations for Manual Use:**
   
   - **Context Window Limits:** Be mindful of the AI model's context window. Loading too many files or very large files into an agent's `customInstructions` or a web bundle can exceed limits or reduce performance. Be selective.
   - **Modularity:** The idea of expansion packs is to keep specialized knowledge separate. When manually integrating, try to maintain this by only giving agents access to what they truly need from an expansion.
   - **Workflows:** If your expansion pack defines new workflows (e.g., a `.yml` file in its `workflows/` directory), you'll need to update your main orchestrator agent to be aware of these and potentially modify its logic to know when to initiate them.

**Recommended Next Steps to Achieve Your Goal**

Given your goal for a highly autonomous, self-developing AI coding system with blockchain capabilities, here are some prioritized next steps:

1. **Deepen Agent Prompts & Capabilities (Iterative Process):**
   
   - **Priority 1: Flesh out the `bmad-smart-contract-dev` Agents:** The current agent files are basic placeholders. The most critical next step is to meticulously develop the prompts within the YAML frontmatter of each agent in `expansion-packs/bmad-smart-contract-dev/agents/`. This includes:
     - Defining comprehensive `core_principles` that guide their behavior and decision-making.
     - Refining `startup` instructions for clear initialization.
     - Detailing specific `commands` they can execute.
     - Listing their `dependencies` on tasks, templates, checklists, and data files *within their own expansion pack* and from `bmad-core` where necessary.
   - **Self-Development Approach:** Use your core agents (e.g., `pm` or `analyst` or a dedicated `PromptEngineer` agent if you create one) to help with this. For example: *"Analyze the placeholder agent file `expansion-packs/bmad-smart-contract-dev/agents/smart-contract-developer.md`. Based on its role, expand its `core_principles` to cover security, gas optimization, and test-driven development. Detail three essential `commands` it should support, and list two tasks and one data file from its own expansion pack that it would depend on."*

2. **Define and Implement Core Tasks for Blockchain:**
   
   - Take the placeholder task files (e.g., `develop-solidity-contract.md`, `audit-smart-contract.md`) and write detailed instructions for each. Define the inputs, the step-by-step process the agent should follow, and the expected outputs.

3. **Develop Blockchain Knowledge Base (`data/` in expansion pack):**
   
   - Start creating markdown files with essential information for your blockchain agents, e.g., `solidity-style-guide.md`, `common-smart-contract-vulnerabilities.md`, `hardhat-cheatsheet.md`. Link these in the `dependencies: data:` section of the relevant smart contract agents.

4. **Test Blockchain Agent Invocation (Manual & Orchestrated):**
   
   - Once `smart-contract-developer.md` has a more robust prompt, try to invoke it directly (e.g., via Roo Code by selecting its mode after running the installer). Give it a simple task: "*Create a 'HelloWorld' Solidity contract with a public string variable `greeting` and a function `setGreeting(string memory _greeting)` to update it. Include NatSpec comments."* Observe its output and iterate on its prompt.
   - Then, try to have the `bmad-orchestrator` delegate a similar task to it.

5. **Implement and Refine the Stigmergic System (`.bmad-state.json`):**
   
   - This is **crucial** for your swarm intelligence and AI-verifiable methodology goals.
   - **Scribe Agent (`bmad-master`):** Ensure the `bmad-master.md` agent's prompt is fully developed to act as the "Scribe" (Saul, as per `pheromind-v2-manual-setup-and-workflow.md`). It must be able to:
     - Initialize `.bmad-state.json` if it doesn't exist (including the `swarmConfig` structure).
     - Read reports from other agents.
     - Parse these reports to generate structured `signals` (e.g., `feature_coded`, `test_failed`, `research_needed`).
     - Update the `signals` array and the `project_documents` map in `.bmad-state.json`.
     - Perform signal pruning based on `swarmConfig`.
   - **Orchestrator Agent (`bmad-orchestrator`):** Enhance Olivia's (the orchestrator) `core_principles` to:
     - Read and interpret `swarmConfig` and `signals` from `.bmad-state.json`.
     - Use this state to make decisions about the next task and which agent to dispatch.
     - Implement autonomous task chaining based on signals (e.g., if `feature_coded` signal appears, and `qa_needed` is a high-priority follow-up based on `swarmConfig`, then dispatch to QA agent).
   - **Testing the Loop:** Have one agent (e.g., `dev`) perform a task, then have `bmad-master` (Scribe) process its output to update `.bmad-state.json`. Then, have `bmad-orchestrator` read the state and decide the next action.

6. **Iterate on Self-Development Capabilities:**
   
   - Once the basic agent interactions and state management are working, try a more complex self-development task. For example, tasking the system to design and implement a new, simple agent for the `bmad-core` based on a `PlanIdeaGenerator.md` blueprint.

7. **Documentation and IDE Support:**
   
   - As you solidify how agents are used in Roo Code, document this process clearly. Then, investigate one of the other IDEs (Cline, Kilo Code, TRAE AI). Determine how to adapt the `.roomodes` concept or use their native features for custom agent definitions. Document this for each IDE.

This is an ambitious project, so breaking it down into these iterative steps, focusing on getting one part working well before expanding, will be key. The combination of robust agent definitions, a well-defined state management system (`.bmad-state.json`), and a capable orchestrator will be the foundation of the autonomous swarm intelligence you're aiming for.
