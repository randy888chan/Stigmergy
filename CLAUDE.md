# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Self-Evolving BMAD (Breakthrough Method of Agile AI-driven Development) Framework** - an adaptive AI-orchestrated development methodology that continuously improves itself through project experience. The system enables rapid project planning, architecture design, and implementation while learning and optimizing its own processes.

## Self-Improvement Strategy

### Core Philosophy
- **Continuous Evolution**: The methodology improves with each project milestone
- **Milestone-Based Learning**: Git commits mark methodology evolution checkpoints
- **User-Approved Changes**: Major methodology changes require explicit approval
- **Rollback Capability**: Version control allows reverting to previous methodology states

### Improvement Triggers
1. **Post-Milestone Retrospectives**: Automatic analysis after each phase completion
2. **Pattern Recognition**: Identification of successful vs. problematic workflows  
3. **User Feedback**: Systematic incorporation of user insights
4. **Effectiveness Metrics**: Measurement of velocity, quality, and satisfaction

## Architecture and Structure

### Core Components

1. **Personas** (`bmad-agent/personas/`) - Self-improving AI agent definitions:
   - **Analyst (Mary)** - Research, brainstorming, project briefs + methodology analysis
   - **PM (John)** - Product requirements documents (PRDs) + process optimization
   - **Architect (Fred)** - System architecture + methodology architecture improvements
   - **Design Architect (Jane)** - UI/UX specs + workflow design improvements
   - **PO (Sarah)** - Validates cross-artifact coherence + methodology validation
   - **Frontend Dev (Ellyn)** - NextJS/React/TypeScript + development process improvements
   - **Full Stack Dev (James)** - General development + implementation optimization
   - **Platform Engineer (Alex)** - Infrastructure + methodology infrastructure
   - **Scrum Master (Bob)** - Story generation + process improvement facilitation

2. **Tasks** (`bmad-agent/tasks/`) - Self-optimizing executable instruction sets
3. **Templates** (`bmad-agent/templates/`) - Adaptive document templates that improve with use
4. **Checklists** (`bmad-agent/checklists/`) - Evolving quality control and validation criteria
5. **Evolution Tracking** (`docs/methodology-evolution/`) - History and metrics of improvements

### Key Design Patterns

- **Adaptive Agent Architecture**: Each persona learns and improves its own capabilities
- **Self-Optimizing Workflows**: Processes automatically suggest improvements based on outcomes
- **Version-Controlled Methodology**: Git tracks methodology evolution with rollback capability
- **Approval-Gated Evolution**: Major changes require user confirmation before implementation
- **Metric-Driven Improvement**: Effectiveness measurements guide optimization decisions

## Working with Self-Improving BMAD Agents

### Milestone-Based Git Workflow

Each major phase completion triggers:
1. **Retrospective Analysis**: What worked well? What needs improvement?
2. **Improvement Identification**: Specific changes to methodology/personas/tasks
3. **Approval Process**: Present changes to user for confirmation
4. **Implementation**: Apply approved improvements
5. **Git Commit**: Version control milestone with descriptive commit message

### Commands for Self-Improvement

- `git log --oneline --grep="Milestone"` - View methodology evolution history
- `git checkout <milestone-hash>` - Rollback to previous methodology version
- `git diff HEAD~1 bmad-agent/` - Compare methodology changes between versions

### Configuration Files

- `ide-bmad-orchestrator.cfg.md` - Self-updating agent configurations
- `web-bmad-orchestrator-agent.cfg.md` - Adaptive web platform configurations
- `docs/methodology-evolution/improvement-log.md` - Track all methodology changes

### Enhanced Template Syntax

Templates now include self-improvement capabilities:
- `{{placeholder}}` - Variable substitution
- `[[LLM: instructions]]` - Hidden AI guidance that can be optimized
- `<<REPEAT>>...<<END-REPEAT>>` - Iterative sections with improvement tracking
- `^^CONDITION^^...^^END-CONDITION^^` - Conditional content based on effectiveness metrics
- `@{example}...@{end}` - Reference examples that update based on successful patterns
- `[[IMPROVE: suggestion]]` - Methodology improvement suggestions

### Self-Evolving Workflow

1. **Ideation**: Analyst creates project briefs + identifies research process improvements
2. **Requirements**: PM transforms briefs into PRDs + optimizes requirements gathering
3. **Design**: Design Architect creates UI/UX specs + refines design processes
4. **Architecture**: Architect designs system structure + improves technical workflows
5. **Validation**: PO ensures alignment + validates methodology improvements
6. **Implementation**: SM generates stories + optimizes development processes
7. **Retrospective**: All agents contribute to methodology evolution analysis

## Development Protocol

### Milestone Commits
Each significant phase generates a commit with format: `"Milestone X: [Phase Name] - [Key Improvements]"`

### Improvement Process
1. **Identify**: What could work better?
2. **Analyze**: Why didn't it work optimally?
3. **Propose**: Specific improvements to methodology
4. **Approve**: Get user confirmation for major changes
5. **Implement**: Apply improvements to personas/tasks/templates
6. **Track**: Document changes in evolution log
7. **Commit**: Version control the improvements

### Rollback Procedure
If methodology changes prove problematic:
1. `git log --oneline --grep="Milestone"` - Find last good milestone
2. `git checkout <hash> -- bmad-agent/` - Restore methodology files
3. `git commit -m "Rollback: Restore methodology to Milestone X"`

## Effectiveness Metrics

- **Velocity**: Time from idea to working implementation
- **Quality**: Reduction in bugs, rework, and user complaints
- **Satisfaction**: User feedback on methodology effectiveness
- **Learning Rate**: Speed of methodology improvement over time

## Development Notes

- **Always ask for approval** before making major methodology changes
- **Document all improvements** in the evolution log
- **Commit at milestones** to maintain version control checkpoints
- **Measure effectiveness** to guide optimization decisions
- **Embrace experimentation** while maintaining rollback capability

This framework represents the first **self-evolving AI development methodology**, continuously optimizing itself through real-world application and user feedback.