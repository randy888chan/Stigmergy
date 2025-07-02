### **The Official Pheromind V3 Installation Guide**

To use your newly refactored Pheromind system on any new software project, you only need to perform these two steps.

#### **Step 1: Copy the System's "Brain"**

For any new project you create, you need to give it the Pheromind system's core intelligence.

**Your Action:**
From your main `randy888chan-bmad-method` repository, copy the following two directories into the root of your **new project folder**:
1.  The `.bmad-core` directory.
2.  The `system_docs` directory.

These two folders contain everything the AI swarm needs to function: its agents, its protocols, and its core principles.

#### **Step 2: Install the IDE Integration File**

This is the crucial step that activates the agents within Roo Code. You are correct that you do not have this file yet.

**Your Action:**
Create a new file in the **root of your new project folder** named `.roomodes.yml`.

Paste the **entire content** below into this new file. This is the complete, correct, and final version that includes all 13 of your agents with the proper `bmad-` prefixed slugs and the correct permission structure.

```yml
customModes:
  - slug: bmad-orchestrator
    name: "🧐 Olivia"
    roleDefinition: "AI System Coordinator & Universal Request Processor."
    whenToUse: "Use as the primary interface for all project tasks."
    customInstructions: |-
      # bmad-orchestrator
      # This block should contain the full content from bmad-core/agents/bmad-orchestrator.md
      CRITICAL: Read the full YML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:
      ...
    groups:
      - read
      - edit
    tools: [mcp, browser, execute]

  - slug: bmad-master
    name: "✍️ Saul"
    roleDefinition: "Pheromone Scribe & State Manager."
    whenToUse: "Processes task results and updates the project's shared state."
    customInstructions: |-
      # bmad-master
      # This block should contain the full content from bmad-core/agents/bmad-master.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit

  - slug: bmad-analyst
    name: "📊 Mary"
    roleDefinition: "Business & Research Analyst."
    whenToUse: "For market research, brainstorming, and creating project briefs."
    customInstructions: |-
      # analyst
      # This block should contain the full content from bmad-core/agents/analyst.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.txt"]
    tools: [mcp, browser]

  - slug: bmad-architect
    name: "🏗️ Winston"
    roleDefinition: "Solution Architect."
    whenToUse: "For system design, architecture documents, and technology selection."
    customInstructions: |-
      # architect
      # This block should contain the full content from bmad-core/agents/architect.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.yml", "**/*.json"]

  - slug: bmad-victor
    name: "📜 Victor"
    roleDefinition: "Smart Contract Developer."
    whenToUse: "For writing, testing, and debugging smart contracts."
    customInstructions: |-
      # victor
      # This block should contain the full content from bmad-core/agents/victor.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit
    tools: [execute, mcp]

  - slug: bmad-qa
    name: "✅ Quinn"
    roleDefinition: "Quality Assurance Gatekeeper."
    whenToUse: "Dispatched by Olivia to validate code quality before completion."
    customInstructions: |-
      # qa
      # This block should contain the full content from bmad-core/agents/qa.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.test.js", "**/*.spec.ts"]
    tools: [execute, mcp]
  
  - slug: bmad-meta
    name: "📈 Metis"
    roleDefinition: "System Auditor & Self-Improvement Specialist."
    whenToUse: "Dispatched by Olivia after major milestones to analyze system performance."
    customInstructions: |-
      # meta
      # This block should contain the full content from bmad-core/agents/meta.md
      CRITICAL: Read the full YML...
    groups:
      - read

  - slug: bmad-pm
    name: "📋 John"
    roleDefinition: "Product Manager."
    whenToUse: "For creating PRDs, defining product strategy, and roadmap planning."
    customInstructions: |-
      # pm
      # This block should contain the full content from bmad-core/agents/pm.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.yml"]

  - slug: bmad-po
    name: "📝 Sarah"
    roleDefinition: "Product Owner."
    whenToUse: "For backlog management, story refinement, and acceptance criteria."
    customInstructions: |-
      # po
      # This block should contain the full content from bmad-core/agents/po.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md"]

  - slug: bmad-sm
    name: "🏃 Bob"
    roleDefinition: "Scrum Master."
    whenToUse: "For creating detailed, actionable user stories from epics."
    customInstructions: |-
      # sm
      # This block should contain the full content from bmad-core/agents/sm.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md"]

  - slug: bmad-ux-expert
    name: "🎨 Sally"
    roleDefinition: "UX Expert."
    whenToUse: "For UI/UX design, wireframes, and front-end specifications."
    customInstructions: |-
      # ux-expert
      # This block should contain the full content from bmad-core/agents/ux-expert.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.drawio", "**/*.fig"]

  - slug: bmad-debugger
    name: "🎯 Dexter"
    roleDefinition: "Root Cause Analyst."
    whenToUse: "When development tasks fail repeatedly."
    customInstructions: |-
      # debugger
      # This block should contain the full content from bmad-core/agents/debugger.md
      CRITICAL: Read the full YML...
    groups:
      - read
    tools: [execute]

  - slug: bmad-refactorer
    name: "🧹 Rocco"
    roleDefinition: "Code Quality Specialist."
    whenToUse: "When tech debt is identified."
    customInstructions: |-
      # refactorer
      # This block should contain the full content from bmad-core/agents/refactorer.md
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit
    tools: [execute]
```
*(Note: As before, I have truncated the `customInstructions` for readability. In your actual file, you would paste the full markdown content of each agent into the corresponding `customInstructions` block.)*

---
### **How to Start a New Project (Your Quick Start Guide)**

From now on, whenever you want to start a new project with Pheromind, the process is simple:

1.  **Create a new project folder:** `mkdir my-new-smart-contract-project`
2.  **Copy the system brain:** `cp -r path/to/randy888chan-bmad-method/.bmad-core ./my-new-smart-contract-project/`
3.  **Copy the system constitution:** `cp -r path/to/randy888chan-bmad-method/system_docs ./my-new-smart-contract-project/`
4.  **Create the `.roomodes.yml` file:** Create the `.roomodes.yml` file inside `my-new-smart-contract-project` and paste the complete content I provided above.
5.  **Open in Roo Code and begin:** Open the `my-new-smart-contract-project` folder in your IDE and start by dispatching a task to `@bmad-orchestrator`.

This concludes our work. You now have a fully refactored, simplified, and robust autonomous system, along with a clear, repeatable process for using it on any new project. It has been a pleasure to work with you.

## 4. Cost Optimization & LLM Tier Strategy

Here is a formal recommendation for assigning different AI model tiers to agent roles to balance cost and performance.

| Agent Role & Name                      | Recommended Tier                               | Justification for Tier Selection                                                                                                                                                                    |
|:---------------------------------------|:-----------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Coordinator (Olivia)**               | **Tier 1 (e.g., Gemini 2.5 Pro)**                | **Mission-Critical.** This is the system's brain. Requires the highest reasoning capability to interpret complex state from signals, prioritize tasks, and manage the autonomous loop. |
| **Scribe (Saul)**                      | **Tier 1 (e.g., Gemini 2.5 Pro)**                | **Mission-Critical.** Tasked with the sophisticated interpretation of unstructured natural language into precise, structured JSON signals. Accuracy here is paramount to prevent state corruption. |
| **Architect (Winston)**                | Tier 1 / Tier 2                                | High-quality architecture prevents countless downstream problems. Use **Tier 1** for generating initial, complex documents. For reviews or small updates, **Tier 2** is sufficient. |
| **Analyst (Mary)**                     | Tier 1 / Tier 2                                | For creative brainstorming, a **Tier 2** model is fine. For code analysis or deep research prompt generation, **Tier 1** is required for depth and accuracy. |
| **Developer (James)**                  | **Tier 2 (e.g., Gemini 2.5 Flash)**            | **Workhorse Role.** Tasks are highly structured and scoped by detailed story files. Needs to be a fast, competent, and cost-effective coder, not a strategic thinker. |
| **Specialized Workers (QA, Debug, Refactor)** | Tier 1 / Tier 2                                | These agents perform high-impact, specialized tasks. A **Tier 1** model ensures the most accurate diagnosis (Debugger) or the highest quality output (QA, Refactorer). |
| **PM, PO, SM, UX Expert**                | **Tier 2 (e.g., Gemini 2.5 Flash)**            | These agents execute structured tasks using templates and checklists. They require reliability and thoroughness, which a balanced **Tier 2** model provides effectively. |
| **Smart Contract Agents** | **Tier 1 (e.g., Gemini 1.5 Pro)** | **High-Stakes Domain.** Due to the financial and security implications of smart contracts, all agents in this domain (Architect, Developer, Auditor) require the highest level of scrutiny, accuracy, and reasoning capability. No compromises here. |

This complete setup provides the robust, documented, and cost-aware framework you need to successfully run the Pheromind V2 system.
