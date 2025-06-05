# BMAD Method Command Reference Guide

## Core Orchestrator Commands

| Command | Description |
|---------|-------------|
| `*help` / `/help` | Display list of commands or help with workflows |
| `*agents` / `/agent-list` | List all available agent personas with their tasks |
| `*{agent}` / `/{agent}` | Switch to specified agent (e.g., *Dev, *Analyst) |
| `*exit` / `/exit` | Return to base BMAD Orchestrator from any agent |
| `*tasks` / `/tasks` | List tasks available to current agent |
| `*party` / `/party-mode` | Enter group chat mode with all available agents |
| `*yolo` / `/yolo` | Toggle between interactive and YOLO mode |
| `*core-dump` | Save current state and progress to debug log |
| `*mpcs` / `/mpcs` | List available Machine-Powered Capabilities |

## Web-Specific Commands

| Command | Description |
|---------|-------------|
| `/doc-out` | Output the full document being discussed without truncation |
| `/load-{agent}` | Immediately switch to the specified agent and greet the user |
| `/bmad {query}` | Direct a query to the BMAD Orchestrator while in another agent |
| `/{agent} {query}` | Direct a query to a specific agent while in another agent |

## Knowledge Management Commands

| Command | Description |
|---------|-------------|
| `*update-knowledge` / `/update-knowledge` | Update all agents with current project knowledge |
| `*generate-knowledge-map` / `/knowledge-map` | Create visual representation of project knowledge |
| `*knowledge-request {topic}` / `/knowledge-request {topic}` | Flag a knowledge gap for future resolution |
| `*validate-knowledge` / `/validate-knowledge` | Validate consistency and completeness of knowledge base |

## Project Workflow Commands

### Project Initialization

| Command | Description |
|---------|-------------|
| `*Analyst Create Project Brief` | Start a new project with initial research |
| `*PM Create PRD` | Create Product Requirements Document from brief |
| `*Architect Create Architecture` | Design system architecture based on PRD |
| `*Design Architect Create Frontend Architecture` | Design UI/UX and frontend architecture |

### Story Management

| Command | Description |
|---------|-------------|
| `*SM create` | Create next implementation story |
| `*SM pivot` | Run course correction for project direction |
| `*SM checklist` | Run story validation checklist |
| `*SM doc-shard` | Break down large documents into manageable pieces |

### Development

| Command | Description |
|---------|-------------|
| `*Dev run-tests` | Execute all tests for current implementation |
| `*Dev lint` | Find and fix code style issues |
| `*Dev explain {concept}` | Get explanation of technical concept |
| `*QA create-test-plan` | Create comprehensive test plan for story |
| `*QA run-tests` | Execute tests and report results |
| `*DevOps deploy` | Deploy to specified environment |
| `*DevOps infra-plan` | Plan infrastructure changes |
| `*Data Scientist analyze` | Analyze data patterns and create insights |

## Machine-Powered Capabilities

| Command | Description |
|---------|-------------|
| `*perplexity {query}` / `/perplexity {query}` | Web search with summarization |
| `*github {query}` / `/github {query}` | Search code repositories and documentation |
| `*firecrawl {query}` / `/firecrawl {query}` | Advanced data extraction and analysis |
| `*dalle {prompt}` / `/dalle {prompt}` | Generate images for UI mockups or concepts |

## Project Extension Workflows

### Adding a New Module

1. `*Architect module-design {module-name}` - Design new module architecture
2. `*PM update-prd {module-name}` - Update PRD with new module requirements
3. `*SM create` - Create implementation stories for the module
4. `*Dev` - Implement the module stories
5. `*QA create-test-plan` - Create test plan for the new module

### Updating Agent Knowledge

1. Complete a project phase (Brief, PRD, Architecture)
2. `*BMAD Update Agent Knowledge` - Extract and distribute knowledge
3. Verify knowledge files in `.ai/` directory

### Creating Custom Agents

1. Copy existing persona file from `bmad-agent/personas/`
2. Modify for specialized role
3. Add to `ide-bmad-orchestrator.cfg.md` with:

```
## Title: {Custom Agent Name}
- Name: {Nickname}
- Customize: "{Specialization details}"
- Description: "{Role description}"
- Persona: "{base-persona-file.md}"
- Tasks:
  - [Task Name](task-file.md)
```

## Documentation Management

| Command | Description |
|---------|-------------|
| `*doc-out` / `/doc-out` | Output full document without truncation |
| `*PO organize` | Organize project documentation |
| `*PO audit` | Audit documentation for completeness |

## Best Practices

### Project Initialization Flow:
Analyst → PM → Architect → Design Architect → PO → SM → Dev → QA → DevOps

### Knowledge Updates:
Run `*BMAD Update Agent Knowledge` after completing each major phase

### Story Development:
- Use SM to create stories
- Use Dev to implement
- Use QA to validate
- Use DevOps to deploy

### MPC Usage:
- Use `*perplexity` during research phases
- Use `*github` during implementation
- Use `*firecrawl` for data analysis
- Use `*dalle` for UI concept visualization

### Agent Switching:
- Use `*{agent}` for temporary switches
- Start new chat for major workflow transitions

---

This reference guide covers the core commands and workflows for effectively using the BMAD Method in your projects.