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

## File Organization Guidelines

### Directory Structure Overview

The BMAD Method uses a **hybrid file organization system** that evolved from earlier versions:

| Directory | Purpose | Contents | Auto-Generated |
|-----------|---------|----------|----------------|
| `docs/` | **Human Deliverables** | Project Briefs, PRDs, Architecture docs, Stories, API docs | ❌ Manual |
| `.ai/` | **Agent Knowledge & Logs** | Project context, tech stack, data models, agent logs | ✅ Auto-created |
| `bmad-agent/` | **BMAD System Files** | Personas, tasks, templates, configuration | ❌ Manual |

### What Goes Where

**`docs/` Directory - Project Documentation:**
- Project Briefs (from Analyst)
- Product Requirements Documents (from PM)
- Architecture Documents (from Architect)
- UX/UI Specifications (from Design Architect)
- User Stories (in `docs/stories/`)
- API Reference documentation
- Sharded documents (broken down from large docs)

### Standard File Naming Convention

**All BMAD Method core documents MUST use lowercase filenames with hyphens:**

| Document Type | Standard Filename | Agent Responsible |
|---------------|-------------------|-------------------|
| Project Brief | `project-brief.md` | Analyst |
| Product Requirements | `prd.md` | PM |
| Architecture | `architecture.md` | Architect |
| Frontend Architecture | `frontend-architecture.md` | Design Architect |
| UX/UI Specification | `uxui-spec.md` | Design Architect |
| Technology Stack | `tech-stack.md` | Architect |
| Data Models | `data-models.md` | Architect/Data Scientist |
| API Reference | `api-reference.md` | Architect |
| Deployment Guide | `deployment-guide.md` | DevOps |
| Test Plan | `test-plan.md` | QA |
| User Stories | `{epic-num}.{story-num}.story.md` | SM |
| Epic Files | `epic-{id}.md` | SM (from sharding) |

### Date Generation Standards

**All agents MUST use actual current dates, not placeholders:**
- Use format: `YYYY-MM-DD` for dates (e.g., `2024-01-15`)
- Use format: `YYYY-MM-DD HH:MM` for timestamps (e.g., `2024-01-15 14:30`)
- **NEVER use placeholders** like `{DATE}`, `[DATE]`, or `TBD`
- **ALWAYS generate actual current date** when creating documents

**`.ai/` Directory - Agent Intelligence:**
- `project-context.md` - Project goals, terminology, domain knowledge
- `tech-stack.md` - Technologies, frameworks, patterns in use
- `data-models.md` - Data structures and analytics approaches
- `deployment-info.md` - Infrastructure and deployment details
- `knowledge-versions.md` - Version history of knowledge updates
- Agent working files (test-issues.md, deployment-history.md, etc.)

### System Evolution Note

**If your project only has `docs/`:** You're likely using an older configuration or haven't run the knowledge update task yet. The current system automatically creates and manages the `.ai/` directory when you run `*BMAD Update Agent Knowledge`.

### Updating Agent Knowledge

#### When to Run Knowledge Updates

**Required Updates (Major Phases):**
- After Project Brief completion
- After PRD creation or major updates
- After Architecture design or significant changes
- After adding new modules or major features
- After tech stack changes

**Frequency Guidelines:**
- **New Projects**: 3-4 times during initial setup
- **Active Development**: Every 2-4 weeks or when major changes occur
- **Mature Projects**: Monthly or when adding significant features

**DON'T Update After:**
- Individual story completions
- Small bug fixes
- Routine development tasks
- Individual test runs

#### Running the Update

1. Complete a project phase (Brief, PRD, Architecture)
2. `*BMAD Update Agent Knowledge` - Extract and distribute knowledge
3. **Automatic Results:**
   - Creates `.ai/` directory if it doesn't exist
   - Generates knowledge files from your `docs/` content
   - Updates agent customization strings
   - Uses semantic versioning (Major.Minor.Patch) to track changes
   - Agents automatically read from `.ai/` for project context

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

## Common Scenarios

### 1. Complete Project Initialization Flow
**Purpose:** Start a new project from scratch through to development

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Create Project Brief` | Brainstorm and research project concept |
| 2 | PM | `*PM Create PRD` | Create Product Requirements Document with epics and stories |
| 3 | Architect | `*Architect Create Architecture` | Design system architecture based on PRD |
| 4 | Design Architect | `*Design Architect Create Frontend Architecture` | Design UI/UX architecture (if applicable) |
| 5 | Design Architect | `*Design Architect Create UXUI Spec` | Create detailed UI/UX specifications |
| 6 | BMAD | `*BMAD Update Agent Knowledge` | Update all agents with project knowledge |
| 7 | PO | `*PO organize` | Organize and validate all documentation |
| 8 | SM | `*SM doc-shard` | Break down large documents into manageable pieces |
| 9 | SM | `*SM create` | Create first implementation story |
| 10 | Dev | `*Dev` | Implement the story |
| 11 | QA | `*QA create-test-plan` | Create test plan for the story |
| 12 | QA | `*QA run-tests` | Execute tests for the implementation |
| 13 | DevOps | `*DevOps deploy` | Deploy the implementation |

**Special Considerations:**
- Run `*BMAD Update Agent Knowledge` after each major phase
- Consider using `*perplexity` during research phases
- For UI-heavy projects, add `*dalle` for mockup generation after step 5

### 2. Brownfield Project Takeover
**Purpose:** Integrate BMAD Method into an existing project

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Analyze Existing Project` | Document current state and challenges |
| 2 | PM | `*PM Reverse Engineer PRD` | Create PRD based on existing functionality |
| 3 | Architect | `*Architect Document Current Architecture` | Map out existing architecture |
| 4 | SM | `*SM doc-shard` | Break down documentation into manageable pieces |
| 5 | BMAD | `*BMAD Update Agent Knowledge` | Update all agents with project knowledge |
| 6 | PO | `*PO audit` | Identify documentation gaps |
| 7 | SM | `*SM create` | Create first enhancement story |
| 8 | Dev | `*Dev` | Implement the enhancement |

**Special Considerations:**
- Use `*github` to search for patterns in the existing codebase
- Consider `*SM pivot` if significant course correction is needed
- Create a project structure document if one doesn't exist

### 3. Adding New Module to Existing Project
**Purpose:** Extend a project beyond original PRD scope

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Research Module Requirements` | Research requirements for new module |
| 2 | PM | `*PM update-prd {module-name}` | Update PRD with new module requirements |
| 3 | Architect | `*Architect module-design {module-name}` | Design new module architecture |
| 4 | Design Architect | `*Design Architect Update Frontend Architecture` | Update UI/UX for new module (if applicable) |
| 5 | BMAD | `*BMAD Update Agent Knowledge` | Update all agents with new module knowledge |
| 6 | SM | `*SM doc-shard` | Break down module documentation |
| 7 | SM | `*SM create` | Create first module implementation story |
| 8 | Dev | `*Dev` | Implement the module story |
| 9 | QA | `*QA create-test-plan` | Create test plan for the module |
| 10 | DevOps | `*DevOps infra-plan` | Plan infrastructure changes for new module |

**Special Considerations:**
- Ensure integration points with existing modules are clearly defined
- Consider impact on existing architecture and data models
- Update knowledge files to include new module terminology

### 4. UI Redesign Workflow
**Purpose:** Implement frontend changes with minimal backend modifications

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Design Architect | `*Design Architect Analyze Current UI` | Document current UI state and issues |
| 2 | PM | `*PM Create UI PRD` | Create UI-focused requirements document |
| 3 | Design Architect | `*Design Architect Create UXUI Spec` | Create detailed UI/UX specifications |
| 4 | Design Architect | `*Design Architect Create Frontend Architecture` | Update frontend architecture |
| 5 | Design Architect | `*Design Architect Create AI Frontend Prompt` | Create prompt for AI UI generation |
| 6 | BMAD | `*BMAD Update Agent Knowledge` | Update agents with UI knowledge |
| 7 | SM | `*SM create` | Create UI implementation story |
| 8 | Dev | `*Dev` | Implement UI changes |
| 9 | QA | `*QA create-test-plan` | Create UI-focused test plan |

**Special Considerations:**
- Use `*dalle` for UI mockup generation
- Focus on component-based architecture for reusability
- Consider accessibility requirements in specifications

### 5. API Integration Project
**Purpose:** Integrate external APIs into an existing project

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Research API` | Research API capabilities and limitations |
| 2 | PM | `*PM Create API Integration PRD` | Document API integration requirements |
| 3 | Architect | `*Architect Design API Integration` | Design integration architecture |
| 4 | BMAD | `*BMAD Update Agent Knowledge` | Update agents with API knowledge |
| 5 | SM | `*SM create` | Create API integration story |
| 6 | Dev | `*Dev` | Implement API integration |
| 7 | QA | `*QA create-test-plan` | Create API testing plan |
| 8 | DevOps | `*DevOps update-env` | Update environment with API credentials |

**Special Considerations:**
- Use `*perplexity` to research API best practices
- Create mock API responses for testing
- Document rate limits and fallback strategies

### 6. Database Migration Project
**Purpose:** Migrate from one database technology to another

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Research Database Options` | Research database technologies |
| 2 | Architect | `*Architect Design Database Migration` | Design migration architecture |
| 3 | Data Scientist | `*Data Scientist analyze` | Analyze data patterns and migration challenges |
| 4 | PM | `*PM Create Migration PRD` | Document migration requirements and phases |
| 5 | BMAD | `*BMAD Update Agent Knowledge` | Update agents with database knowledge |
| 6 | SM | `*SM create` | Create database migration story |
| 7 | Dev | `*Dev` | Implement migration code |
| 8 | QA | `*QA create-test-plan` | Create data validation test plan |
| 9 | DevOps | `*DevOps infra-plan` | Plan infrastructure changes for new database |

**Special Considerations:**
- Create data validation strategies for before and after migration
- Plan for rollback scenarios
- Consider performance testing with representative data volumes

### 7. Performance Optimization Project
**Purpose:** Improve performance of an existing application

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | Analyst | `*Analyst Performance Analysis` | Identify performance bottlenecks |
| 2 | Architect | `*Architect Performance Optimization Plan` | Design optimization strategy |
| 3 | PM | `*PM Create Optimization PRD` | Document optimization requirements |
| 4 | BMAD | `*BMAD Update Agent Knowledge` | Update agents with performance knowledge |
| 5 | SM | `*SM create` | Create optimization story |
| 6 | Dev | `*Dev` | Implement optimizations |
| 7 | QA | `*QA create-performance-test-plan` | Create performance test plan |
| 8 | Data Scientist | `*Data Scientist analyze-metrics` | Analyze performance metrics |

**Special Considerations:**
- Establish performance baselines before changes
- Use `*github` to research optimization patterns
- Consider both frontend and backend optimizations

### Best Practices for Scenario Execution

**Documentation First:** Complete documentation phases before implementation

**Knowledge Updates:** Run `*BMAD Update Agent Knowledge` after each major phase

**Incremental Implementation:** Create and implement stories one at a time

**Regular Testing:** Integrate QA testing throughout the process

**Feedback Loops:** Use `*SM pivot` if significant course correction is needed

**MPC Integration:** Leverage appropriate MPCs for each scenario:
- Research: `*perplexity`
- Code patterns: `*github`
- Data analysis: `*firecrawl`
- UI visualization: `*dalle`

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