# BMAD METHOD - Build, Manage, Adapt & Deliver

A comprehensive Agent-based software development methodology that orchestrates specialized AI personas through the complete software lifecycle. The BMAD Method transforms how teams approach product development by providing memory-enhanced, quality-enforced workflows that adapt and improve over time.

## What is BMAD?

BMAD is more than a workflow—it's an intelligent development companion that:
- 🎭 **Orchestrates specialized AI personas** for every development role
- 🧠 **Learns from experience** through integrated memory systems
- ✅ **Enforces quality standards** with zero-tolerance for anti-patterns
- 🔄 **Adapts to your patterns** becoming more effective over time
- 🤝 **Enables collaboration** through multi-persona consultations

## Key Components

- 🎭 **Specialized Personas** - Expert agents for PM, Architect, Dev, QA, and more
- 📋 **Smart Task System** - Context-aware task execution with quality gates
- ✅ **Quality Enforcement** - Automated standards compliance and validation
- 📝 **Templates** - Standardized document templates for consistent deliverables
- 🧠 **Memory Integration** - Persistent learning and context management via OpenMemory MCP
- ⚡ **Performance Optimization** - Smart caching and resource management

## Orchestrator Variations

The BMAD Method includes two orchestrator implementations, each optimized for different contexts:

### IDE Orchestrator (Primary)
**Files**: `bmad-agent/ide-bmad-orchestrator.md` & `bmad-agent/ide-bmad-orchestrator.cfg.md`

**Purpose**: Optimized for IDE integration with comprehensive memory enhancement and quality enforcement

**Key Features**:
- Memory-enhanced context continuity
- Proactive intelligence and pattern recognition
- Multi-persona consultation mode
- Integrated quality enforcement framework
- Performance optimization for IDE environments

**Best For**: Active development in IDE environments where memory persistence and quality enforcement are critical

### Web Orchestrator (Alternative)
**Files**: `bmad-agent/web-bmad-orchestrator-agent.md` & `bmad-agent/web-bmad-orchestrator-agent.cfg.md`

**Purpose**: Streamlined for web-based or lightweight environments

**Key Features**:
- Simplified persona management
- Basic task orchestration
- Minimal resource footprint
- Web-friendly command structure

**Best For**: Web interfaces, demos, or resource-constrained environments

### Choosing an Orchestrator
- Use **IDE Orchestrator** for full-featured development with memory and quality enforcement
- Use **Web Orchestrator** for lightweight deployments or web-based interfaces
- Both orchestrators share the same persona and task definitions for consistency

## Key Features

### 🧠 Memory-Enhanced Development
- **Persistent Learning**: Remembers decisions, patterns, and outcomes across sessions
- **Proactive Intelligence**: Warns about potential issues based on past experiences
- **Context-Rich Handoffs**: Smooth transitions between personas with full historical context
- **Pattern Recognition**: Identifies and suggests successful approaches from past projects

### ✅ Quality Enforcement Framework
- **Zero-Tolerance Anti-Patterns**: Automated detection and prevention of poor practices
- **Ultra-Deep Thinking Mode (UDTM)**: Systematic multi-angle analysis for critical decisions
- **Quality Gates**: Mandatory checkpoints before phase transitions
- **Brotherhood Reviews**: Honest, specific peer feedback requirements
- **Evidence-Based Decisions**: All choices backed by data and validation

### 🎭 Specialized Personas
Each persona is an expert in their domain with specific skills, tasks, and quality standards:
- **PM (Product Manager)**: Market research, requirements, prioritization
- **Architect**: System design, technical decisions, patterns
- **Dev**: Implementation with quality compliance
- **QA/Quality Enforcer**: Standards enforcement, validation
- **SM (Scrum Master)**: Story creation, sprint management
- **Analyst**: Research, brainstorming, documentation
- **PO (Product Owner)**: Validation, acceptance, delivery

### 🔄 Intelligent Workflows
- **Adaptive Recommendations**: Suggests next steps based on context
- **Multi-Persona Consultations**: Coordinate multiple experts for complex decisions
- **Workflow Templates**: Pre-defined paths for common scenarios
- **Progress Tracking**: Real-time visibility into project status

## Getting Started

### Quick Start (IDE)
1. Copy the BMAD agent folder to your project
2. Open `bmad-agent/ide-bmad-orchestrator.md` in your AI assistant
3. The orchestrator will initialize and guide you through available commands
4. Start with `/start` to begin a new session

### Quick Start (Web)
1. Copy the BMAD agent folder to your web project
2. Load `bmad-agent/web-bmad-orchestrator-agent.md` in your interface
3. Use web-friendly commands to interact with personas
4. Begin with `/help` to see available options

### Core Commands
- `/start` - Initialize a new session
- `/status` - Check current state and active persona
- `/[persona]` - Switch to a specific persona (e.g., `/pm`, `/dev`)
- `/consult` - Start multi-persona consultation
- `/memory-status` - View memory integration status
- `/help` - Get context-aware assistance

## Example Workflow

```markdown
# Starting a new feature
/start
/pm analyze "Payment processing feature"
> PM analyzes market, creates requirements with UDTM

/architect design
> Architect creates technical design with quality gates

/consult pm, architect, dev
> Multi-persona consultation validates approach

/sm create-stories
> SM creates quality-validated user stories

/dev implement STORY-001
> Dev implements with anti-pattern detection

/quality validate
> Quality enforcer runs comprehensive validation
```

## Project Structure

```
bmad-agent/
├── personas/           # Persona definitions with quality standards
├── tasks/             # Executable task definitions
├── quality-tasks/     # Quality-specific validation tasks
├── templates/         # Document templates
├── checklists/        # Validation checklists
├── memory/            # Memory integration guides
├── workflows/         # Standard workflow definitions
├── config/            # Performance and system configuration
└── orchestrators/     # IDE and Web orchestrator files
```

## Memory System Integration

BMAD integrates with [OpenMemory MCP](https://mem0.ai/openmemory-mcp) for persistent intelligence:
- **Automated Learning**: Captures decisions, patterns, and outcomes
- **Search & Retrieval**: Finds relevant past experiences
- **Pattern Recognition**: Identifies successful approaches
- **Continuous Improvement**: Gets smarter with each use

**Setup**: Follow the [OpenMemory MCP Setup Guide](./docs/setup-configuration/openmemory-setup.md) to enable advanced memory features.

## Quality Metrics

The framework tracks comprehensive quality metrics:
- Code coverage requirements (>90%)
- Technical debt ratios (<5%)
- Anti-pattern detection rates
- UDTM compliance scores
- Brotherhood review effectiveness
- Evidence-based decision percentages

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code standards and quality requirements
- Persona development guidelines
- Task creation best practices
- Memory integration patterns

## Documentation

- [Full Documentation](./docs/)
- [Persona Guide](./docs/personas.md)
- [Task Development](./docs/tasks.md)
- [Memory Integration](./docs/memory.md)
- [Quality Framework](./docs/quality.md)

## License

[MIT License](./docs/LICENSE)

---

**Thank you and enjoy building amazing software with BMAD!**

*- BMad*
