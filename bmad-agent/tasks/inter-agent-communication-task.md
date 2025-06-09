# Inter-Agent Communication Task

## Purpose
Establish structured communication protocols between BMAD agents to ensure seamless collaboration, efficient information transfer, and coordinated execution of complex multi-agent workflows.

## Communication Framework

### 1. Shared Context Management

**Project Context File Structure:**
```yaml
project-context.yml:
  project:
    name: "Project Name"
    phase: "Current Phase"
    status: "Active/On-Hold/Complete"
  
  artifacts:
    project-brief: "docs/project-brief.md"
    prd: "docs/prd.md"
    architecture: "docs/architecture.md"
    ui-spec: "docs/ui-spec.md"
    stories: "docs/stories/"
  
  active-work:
    current-agent: "Agent Name"
    current-task: "Task Description"
    blockers: []
    dependencies: []
  
  decisions:
    - decision: "Description"
      made-by: "Agent"
      rationale: "Reasoning"
      date: "Date"
  
  handoffs:
    pending:
      - from: "Agent A"
        to: "Agent B"
        artifact: "Document"
        notes: "Special considerations"
    completed:
      - from: "Agent X"
        to: "Agent Y"
        artifact: "Document"
        timestamp: "Date/Time"
```

### 2. Agent Handoff Protocol

**Structured Handoff Template:**
```markdown
## Agent Handoff

### From: [Source Agent]
### To: [Target Agent]
### Date: [Timestamp]

### Deliverables
- **Primary Artifact**: [Main document/output]
- **Supporting Documents**: [List of related files]
- **Context Files**: [Shared context, decisions, etc.]

### Key Information
- **Completed Work**: [What was accomplished]
- **Critical Decisions**: [Important choices made and why]
- **Assumptions**: [Any assumptions that need validation]
- **Open Questions**: [Items needing clarification]

### Special Considerations
- **Constraints**: [Technical, business, or resource constraints]
- **Risks**: [Identified risks requiring attention]
- **Dependencies**: [External dependencies to track]
- **Suggestions**: [Recommendations for next steps]

### Success Criteria
- [Specific criteria for successful completion of next phase]
- [Quality benchmarks to maintain]
- [Deadlines or time constraints]

### Tools and Resources
- **Recommended Tools**: [Specific tools that would be helpful]
- **Reference Materials**: [Documentation, examples, etc.]
- **Contact Points**: [Stakeholders or experts to consult]
```

### 3. Communication Patterns

**Pattern 1: Sequential Handoff**
```
Analyst → PM → Architect → Design Architect → PO → SM → Dev

Communication:
- Each agent creates handoff document
- Updates shared context file
- Notifies next agent of readiness
- Provides feedback to previous agent
```

**Pattern 2: Parallel Collaboration**
```
Architect + Design Architect (working simultaneously)

Communication:
- Shared design decisions document
- Regular sync points defined
- Conflict resolution protocol
- Merged deliverables process
```

**Pattern 3: Iterative Feedback**
```
Dev ↔ QA (continuous testing loop)

Communication:
- Real-time issue reporting
- Fix verification workflow
- Regression test triggers
- Quality metrics sharing
```

**Pattern 4: Escalation Path**
```
Any Agent → PO → PM → Stakeholder

Communication:
- Issue escalation criteria
- Impact assessment required
- Decision documentation
- Resolution communication
```

### 4. Information Exchange Formats

**Status Update Format:**
```markdown
## Status Update - [Agent Name]
### Date: [Timestamp]

### Progress
- **Completed**: [List of completed items]
- **In Progress**: [Current work items]
- **Blocked**: [Blockers and needed help]

### Metrics
- **Velocity**: [On track/Ahead/Behind]
- **Quality**: [Metrics or assessments]
- **Risks**: [New or changed risks]

### Next Steps
- [Planned activities]
- [Expected completion]
- [Dependencies needed]
```

**Decision Record Format:**
```markdown
## Decision Record #[Number]
### Title: [Decision Title]
### Date: [Timestamp]
### Participants: [Agents involved]

### Context
[Background and why decision was needed]

### Options Considered
1. **Option A**: [Description]
   - Pros: [Benefits]
   - Cons: [Drawbacks]
2. **Option B**: [Description]
   - Pros: [Benefits]
   - Cons: [Drawbacks]

### Decision
[Selected option and rationale]

### Implications
- **Technical**: [Technical impacts]
- **Timeline**: [Schedule impacts]
- **Resources**: [Resource impacts]

### Action Items
- [Specific actions needed]
- [Responsible agents]
- [Deadlines]
```

### 5. Tool-Enabled Communication

**Using Todo System for Coordination:**
```javascript
// Agent A creates tasks for Agent B
TodoWrite({
  todos: [
    {
      id: "handoff-001",
      content: "Review PRD and provide architecture feedback",
      status: "pending",
      priority: "high",
      assigned: "Architect",
      created_by: "PM",
      due_date: "2024-01-20"
    }
  ]
})
```

**Using Shared Files for Context:**
```bash
# Create shared context file
Write("project-context.yml", context_data)

# Update after each major change
Edit("project-context.yml", old_section, new_section)

# Read before starting work
Read("project-context.yml")
```

**Using Git for Coordination:**
```bash
# Create feature branch for agent work
git checkout -b feature/analyst-research

# Commit with agent identifier
git commit -m "Analyst: Complete market research and competitive analysis"

# Create PR with handoff information
gh pr create --title "Analyst → PM: Project Brief Ready" \
  --body "$(cat handoff-template.md)"
```

### 6. Conflict Resolution

**Conflict Types and Resolution:**

**1. Requirement Conflicts**
- **Detection**: Multiple interpretations of requirements
- **Resolution**: PM facilitates clarification session
- **Documentation**: Updated PRD with clarifications

**2. Technical Conflicts**
- **Detection**: Incompatible technical decisions
- **Resolution**: Architect leads technical review
- **Documentation**: Architecture decision record

**3. Timeline Conflicts**
- **Detection**: Competing priorities or deadlines
- **Resolution**: PO prioritizes based on business value
- **Documentation**: Updated project timeline

**4. Resource Conflicts**
- **Detection**: Multiple agents need same resources
- **Resolution**: SM coordinates resource allocation
- **Documentation**: Resource allocation matrix

### 7. Communication Best Practices

**1. Clarity and Completeness**
- Use structured templates for consistency
- Include all relevant context and decisions
- Avoid ambiguous language
- Provide specific examples when helpful

**2. Timeliness**
- Communicate blockers immediately
- Provide regular status updates
- Complete handoffs promptly
- Respond to queries within defined SLAs

**3. Traceability**
- Link all decisions to requirements
- Maintain audit trail of changes
- Reference source documents
- Use unique identifiers for tracking

**4. Efficiency**
- Avoid redundant communication
- Use appropriate detail level
- Leverage automation where possible
- Batch related communications

### 8. Monitoring and Improvement

**Communication Metrics:**
- Handoff completion time
- Rework due to miscommunication
- Query resolution time
- Stakeholder satisfaction

**Continuous Improvement:**
- Regular retrospectives on communication
- Pattern analysis for common issues
- Template and process refinement
- Tool optimization for better flow

## Integration with BMAD Workflow

This communication framework integrates seamlessly with the BMAD methodology:

1. **Analyst Phase**: Establishes initial context and communication patterns
2. **PM Phase**: Defines stakeholder communication protocols
3. **Architecture Phase**: Technical communication standards
4. **Development Phase**: Real-time collaboration patterns
5. **Validation Phase**: Feedback and improvement loops

The framework ensures that as the Self-Evolving BMAD Framework learns and improves, communication patterns also evolve to support increasingly efficient collaboration between agents.