# 🏗️ Stigmergy System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          STIGMERGY SYSTEM                                           │
├───────────────┬───────────────────────┬───────────────────────┬───────────────────────┬─────────────┤
│  HUMAN        │  AGENT SWARM          │  STATE MANAGEMENT     │  CODE INTELLIGENCE    │  TOOLS      │
│  INTERFACE    │                       │                       │                       │             │
├───────────────┼───────────────────────┼───────────────────────┼───────────────────────┼─────────────┤
│ Web UI        │ Dispatcher (Saul)     │ State Manager         │ Neo4j Knowledge Graph │ Research    │
│ IDE Plugin    │ Planner (Mary)        │ Project Ledger        │ Code Analysis Engine  │ File System │
│ CLI           │ Business (Brian)      │ Swarm Memory          │                       │ Shell       │
│               │ Architect (Winston)   │                       │                       │             │
│               │ UX Expert (Sally)     │                       │                       │             │
│               │ Developer (James)     │                       │                       │             │
│               │ QA (Quinn)            │                       │                       │             │
│               │ Debugger (Dexter)     │                       │                       │             │
│               │ Refactorer (Rocco)    │                       │                       │             │
│               │ Valuator (Val)        │                       │                       │             │
│               │ Meta (Metis)          │                       │                       │             │
└───────────────┴───────────────────────┴───────────────────────┴───────────────────────┴─────────────┘
```

## Core Components

### 1. Agent Swarm
- **Dispatcher (Saul)**: Coordinates workflow, delegates tasks, enforces process
- **Planner Agents**: Analyst (Mary), Business Planner (Brian), Design Architect (Winston), UX Expert (Sally)
- **Executor Agents**: Developer (James), QA (Quinn), Debugger (Dexter), Refactorer (Rocco)
- **Specialized Agents**: Valuator (Val), Meta (Metis)

### 2. State Management
- **Project Ledger**: Immutable record of all project decisions and states
- **Swarm Memory**: Historical data on agent performance, task outcomes, and patterns
- **State Schema**: Formal definition of project state structure and transitions

### 3. Code Intelligence
- **Neo4j Knowledge Graph**: Stores code structure, relationships, and metrics
- **Code Analysis Engine**: Provides deep code understanding and metrics
- **Verification Tools**: Programmatic validation of code against requirements

### 4. Tools & Integrations
- **Research Tools**: Web access for market and technical research
- **File System**: Read/write access to project files
- **Shell**: Execution of system commands
- **Web UI & IDE Integration**: Seamless user experience

## Workflow Process

1. **Brainstorming**: Define high-level goals and vision
2. **Requirements Gathering**: Convert vision into detailed user stories
3. **Architectural Design**: Create technical blueprint and execution plan
4. **Task Breakdown**: Decompose stories into executable micro-tasks
5. **Execution Planning**: Assign tasks, define verification criteria
6. **Implementation**: Code development and verification
7. **Validation**: Ensure outcomes meet business and technical requirements
8. **Learning**: System self-improvement based on execution data

## Data Flow

1. Human inputs trigger system initialization
2. Dispatcher delegates to planner agents
3. Planner agents create structured outputs
4. Dispatcher coordinates handoff to executor agents
5. Executors perform work and verify results
6. Meta agent analyzes outcomes for system improvement
7. All state changes are recorded in the project ledger
