# Quality Tasks Directory

## Purpose
This directory contains quality-focused task definitions that can be executed by various BMAD personas to ensure comprehensive quality compliance throughout the development lifecycle.

## Task Categories

### Ultra-Deep Thinking Mode (UDTM) Tasks
- **[ultra-deep-thinking-mode.md](ultra-deep-thinking-mode.md)** - Generic UDTM framework adaptable to all personas
- **[architecture-udtm-analysis.md](architecture-udtm-analysis.md)** - Architecture-specific 120-minute UDTM protocol
- **[requirements-udtm-analysis.md](requirements-udtm-analysis.md)** - Requirements-specific 90-minute UDTM protocol

### Technical Quality Tasks
- **[technical-decision-validation.md](technical-decision-validation.md)** - Systematic validation of technology choices
- **[technical-standards-enforcement.md](technical-standards-enforcement.md)** - Code quality and standards compliance
- **[test-coverage-requirements.md](test-coverage-requirements.md)** - Comprehensive testing standards

### Process Quality Tasks
- **[evidence-requirements-prioritization.md](evidence-requirements-prioritization.md)** - Data-driven prioritization framework
- **[story-quality-validation.md](story-quality-validation.md)** - User story quality assurance
- **[code-review-standards.md](code-review-standards.md)** - Consistent code review practices

### Measurement & Monitoring
- **[quality-metrics-tracking.md](quality-metrics-tracking.md)** - Quality metrics collection and analysis

## Integration with BMAD Method

These quality tasks integrate with the BMAD orchestrator through:

1. **Persona Task Lists** - Each persona references relevant quality tasks
2. **Memory System** - Tasks include memory integration patterns for learning
3. **Quality Gates** - Tasks define gates that must be passed before proceeding
4. **Brotherhood Collaboration** - Tasks specify cross-team validation requirements

## Usage Examples

### By PM Persona
```markdown
/pm requirements-udtm-analysis "New payment feature"
```

### By Architect Persona
```markdown
/architect architecture-udtm-analysis "Microservices migration"
```

### By Dev Persona
```markdown
/dev code-review-standards PR#123
```

### By Quality Enforcer
```markdown
/quality technical-standards-enforcement src/
```

## Success Metrics

- All development work passes through relevant quality tasks
- Quality gate failures <5%
- Continuous improvement in quality metrics
- Team adoption rate >95% 