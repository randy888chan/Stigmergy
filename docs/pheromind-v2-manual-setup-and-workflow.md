# Pheromind V2: Full IDE Setup & Workflow Guide

**Version:** 2.0
**Status:** This is the master setup document for the Pheromind autonomous swarm architecture.

## 1. Overview
This document provides the complete instructions for configuring your project to run the Pheromind V2 swarm entirely within a local IDE like Roo Code. It includes the definitive `.roomodes.json` configuration and the necessary modifications to integrate expansion packs.

## 2. The `.roomodes.json` Configuration
This is the central configuration for your IDE. It defines every agent in the swarm and embeds their core operational protocols.

**Action:** Replace the entire content of your project's root `roomodes.json` file with the content below.

```yaml
customModes:
  - slug: bmad-orchestrator
    name: "🧐 Olivia"
    roleDefinition: "AI System Coordinator & Universal Request Processor."
    whenToUse: "Use as the primary interface for all project tasks."
    customInstructions: |-
      # bmad-orchestrator
      CRITICAL: Read the full YML...
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
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.yml", "**/*.json"]

  - slug: bmad-dev
    name: "💻 James"
    roleDefinition: "Full Stack Developer."
    whenToUse: "For all coding tasks, bug fixing, and technical implementation."
    customInstructions: |-
      # dev
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
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.md", "**/*.test.js", "**/*.spec.ts"]
    tools: [execute, mcp]
  
  - slug: bmad-meta
    name: "📈 Metis"
    roleDefinition: "System Auditor & Self-Improvement Specialist."
    whenToUse: "Dispatched by Olivia after major milestones to analyze system performance and propose improvements."
    customInstructions: |-
      # meta
      CRITICAL: Read the full YML...
    groups:
      - read

  - slug: bmad-pm
    name: "📋 John"
    roleDefinition: "Product Manager."
    whenToUse: "For creating PRDs, defining product strategy, and roadmap planning."
    customInstructions: |-
      # pm
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
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit
    tools: [execute]

  - slug: bmad-smart-contract-architect
    name: "🏗️ Leo"
    roleDefinition: "Smart Contract Architect."
    whenToUse: "For designing the architecture of smart contract systems."
    customInstructions: |-
      # smart-contract-architect
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit

  - slug: bmad-smart-contract-developer
    name: "📜 Victor"
    roleDefinition: "Smart Contract Developer."
    whenToUse: "For writing, testing, and debugging smart contracts."
    customInstructions: |-
      # smart-contract-developer
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit
    tools: [execute, mcp]

  - slug: bmad-smart-contract-auditor
    name: "🛡️ Eva"
    roleDefinition: "Smart Contract Auditor."
    whenToUse: "For performing security audits of smart contract code."
    customInstructions: |-
      # smart-contract-auditor
      CRITICAL: Read the full YML...
    groups:
      - read
    tools: [execute, mcp]

  - slug: bmad-smart-contract-tester
    name: "🔬 Miles"
    roleDefinition: "Smart Contract Tester."
    whenToUse: "For writing and executing comprehensive test suites for smart contracts."
    customInstructions: |-
      # smart-contract-tester
      CRITICAL: Read the full YML...
    groups:
      - read
      - - edit
        - filePatterns: ["**/*.test.js", "**/*.spec.ts", "**/*.sol"]
    tools: [execute]

  - slug: bmad-blockchain-integration-developer
    name: "🔗 Nina"
    roleDefinition: "Blockchain Integration Developer."
    whenToUse: "For developing off-chain components that interact with smart contracts."
    customInstructions: |-
      # blockchain-integration-developer
      CRITICAL: Read the full YML...
    groups:
      - read
      - edit
    tools: [execute, mcp]
```

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
