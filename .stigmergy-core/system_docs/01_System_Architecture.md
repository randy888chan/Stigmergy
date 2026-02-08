# 🏗️ Stigmergy System Architecture (Modernized)

## High-Level Architecture

The system now operates on a chat-first, plan-driven workflow. The `@system` agent is the primary entry point, and the `@dispatcher` acts as an autonomous project manager executing a machine-readable plan.

```mermaid
graph TD
    subgraph "User Interaction Layer"
        User[🧑 User] --> IDE[💬 IDE / Dashboard];
    end

    subgraph "Control & Orchestration Layer"
        IDE --> System["@system (Entry Point)"];
        System -- "User Goal" --> Specifier["@specifier (Plan Creator)"];
        Specifier -- "Creates" --> PlanMD["plan.md (YAML Task List)"];
    end

    subgraph "Autonomous Execution Loop"
        Dispatcher["@dispatcher (Plan Executor)"] -- "Reads" --> PlanMD;
        Dispatcher -- "Delegates Task" --> Executor["@executor (Code Implementer)"];
        Executor -- "Writes Code" --> Files[Project Files];
        Executor -- "Reports Completion" --> Dispatcher;
        Dispatcher -- "Updates Status" --> PlanMD;
    end

    subgraph "Core Services"
        Tools[🛠️ Tools (File System, Research, etc.)];
        KnowledgeGraph[(🧠 Neo4j Knowledge Graph)];
    end

    System --> Tools;
    Executor --> Tools;
    Executor --> KnowledgeGraph;
```

## Core Components

### 1. Control & Orchestration

-   **@system**: The primary conversational interface. It interprets the user's initial command and delegates the creation of the project plan to the `@specifier`.
-   **@specifier**: The primary planner. It takes a high-level goal and creates a detailed, machine-readable `plan.md` file, breaking the goal into a sequence of tasks.
-   **@dispatcher**: The autonomous project manager. It reads the `plan.md` file and executes the tasks in order, delegating the actual implementation work to executor agents.

### 2. Execution

-   **@executor / @dev**: Focused agents that receive a single, well-defined task from the dispatcher, generate the required code, and save it to the file system.
-   **@qa**: A quality assurance agent that can be called by the dispatcher to verify the completed work against the original plan.

## Modern Workflow Process

1.  **Initiation**: The user provides a high-level goal to the `@system` agent via the chat interface.
2.  **Planning**: The `@system` agent delegates to the `@specifier`, which creates a `plan.md` file containing a YAML list of all tasks, dependencies, and files to be modified.
3.  **Execution**: The `@dispatcher` agent is activated. It enters a loop:
    a. Reads `plan.md`.
    b. Finds the next task with `status: PENDING`.
    c. Delegates the task to an executor agent (e.g., `@executor`).
    d. Updates the task's status in `plan.md` and saves the file.
4.  **Completion**: When all tasks in `plan.md` are `COMPLETED`, the dispatcher reports back that the goal has been achieved.

## 🧠 Advanced Capabilities

### Blackboard Architecture (Task Queue)
Stigmergy implements a **Blackboard Architecture** via a centralized Task Queue. This allows multiple agents to observe the system state and pick up non-dependent tasks in parallel, significantly increasing development speed. The `GraphStateManager` acts as the central coordinator, ensuring data consistency across the swarm.

### Deep Code Intelligence (CodeRAG)
The **CodeRAG (Code Retrieval-Augmented Generation)** module provides "Deep Code Intelligence." It automatically scans the codebase, extracts semantic relationships, and stores them in the Neo4j Knowledge Graph. This allows agents to understand complex dependencies and "Consult" with the codebase to answer architectural questions with high precision.
