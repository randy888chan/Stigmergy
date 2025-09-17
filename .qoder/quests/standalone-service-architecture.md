# Stigmergy Standalone Service Architecture Design

## 1. Overview

This document outlines the architectural transformation of Stigmergy from a project-level dependency to a standalone, universal AI development service. The new architecture will enable Stigmergy to operate on any project directory regardless of programming language, similar to how Trae Agent functions as a standalone CLI tool.

The key objectives of this transformation are:
- Decouple Stigmergy from the Node.js ecosystem
- Enable global installation and execution
- Support multi-language project development
- Provide a consistent interface for IDE integration
- Maintain all existing advanced features (trajectory recording, evaluation, cost monitoring)

This refactoring addresses the fundamental limitation that Stigmergy currently must be installed as a node_module within each project, which prevents its use in Python, Java, or Go repositories. The new architecture follows the model of professional development tools like Docker and language servers.

## 2. Architecture

### 2.0 Implementation Approach

The transformation will follow these key principles:
1. **Decoupling**: Separate the Stigmergy engine from the projects it operates on
2. **Global Availability**: Enable installation and execution from any directory
3. **Context Awareness**: Make the engine operate on whatever directory it is launched from
4. **Backward Compatibility**: Maintain existing functionality while enabling new capabilities
5. **Test-Driven Development**: Write tests for all new functionality
6. **Clear Documentation**: Document the new architecture and user workflow clearly

#### 2.0.1 Implementation Phases

**Phase 1: Core Architecture Refactoring**
- Adapt package.json for global installation
- Create new `init` command to replace `install`
- Deprecate old `install` command with migration message
- Make engine CWD-aware for project targeting

**Phase 2: Feature Integration**
- Integrate Trajectory Recording Service with project context
- Implement Evaluator Agent delegation in dispatcher
- Finalize Benchmark Runner implementation
- Integrate Cost Monitoring Dashboard

**Phase 3: Documentation and Verification**
- Update all documentation for new workflow
- Create observability and evaluation documentation
- Run full test suite and benchmark suite
- Verify cross-language project support

### 2.1 Current Architecture Limitations

The current Stigmergy architecture has several limitations:
- Tied to Node.js ecosystem through `npm install` in project directories
- Requires `.stigmergy-core` to be copied into each project
- Limited to Node.js projects only
- Multiple MCP server instances required per project
- Difficult to maintain consistent configuration across projects

Specifically, users cannot run `npm install` in Python, Java, or Go repositories, which fundamentally limits Stigmergy's universal applicability. Tools like CodeRAG and Archon work because they operate as standalone services that are pointed at a project directory, rather than being installed inside it.

### 2.2 New Standalone Architecture

The new architecture introduces a global service model:

#### 2.2.1 Architecture Comparison

| Aspect | Old Model (Current) | New Standalone Service Model (Goal) |
|--------|---------------------|-------------------------------------|
| Installation | `npm install` inside a Node.js project | `npm install -g @randy888chan/stigmergy` once, globally |
| How it Runs | As a script (`npm run stigmergy:start`) within a project's package.json | As a global command (`stigmergy start`) from any directory |
| Project Integration | The agent is part of the project. `.stigmergy-core` is copied in | The agent is an external tool that targets a project. A new `stigmergy init` command creates a local `.stigmergy/` config folder in the target project |
| Language Support | Node.js projects only | Any language. Works on Python, Java, Go, etc., because it's not installed in them |
| MCP Connection | Requires a separate `mcp-server.js` in every project | The IDE connects to a single, stable Stigmergy service running on a known port (e.g., 3010) |

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Development Environment                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Python    │    │    Java     │    │     Go      │             │
│  │   Project   │    │   Project   │    │   Project   │             │
│  │             │    │             │    │             │             │
│  │  ┌────────┐ │    │  ┌────────┐ │    │  ┌────────┐ │             │
│  │  │.stigmer│ │    │  │.stigmer│ │    │  │.stigmer│ │             │
│  │  │  gy/   │ │    │  │  gy/   │ │    │  │  gy/   │ │             │
│  │  └────────┘ │    │  └────────┘ │    │  └────────┘ │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
└─────────┬─────────────────┬───────────────────┬─────────────────────┘
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │
          ┌─────────────────▼───────────────────┐
          │     Stigmergy Standalone Service    │
          │                                     │
          │  ┌────────────────────────────────┐ │
          │  │        CLI Interface           │ │
          │  └────────────────────────────────┘ │
          │  ┌────────────────────────────────┐ │
          │  │      Engine (WebSocket)        │ │
          │  └────────────────────────────────┘ │
          │  ┌────────────────────────────────┐ │
          │  │     Trajectory Recorder        │ │
          │  └────────────────────────────────┘ │
          │  ┌────────────────────────────────┐ │
          │  │       Cost Monitor             │ │
          │  └────────────────────────────────┘ │
          │  ┌────────────────────────────────┐ │
          │  │       Evaluator Agent          │ │
          │  └────────────────────────────────┘ │
          │  ┌────────────────────────────────┐ │
          │  │     Benchmark Runner           │ │
          │  └────────────────────────────────┘ │
          └─────────────────┬───────────────────┘
                            │
          ┌─────────────────▼───────────────────┐
          │         IDE Integration             │
          │  (VS Code, Roo Code, Cursor, etc.)  │
          └─────────────────────────────────────┘
```

### 2.3 Key Components

#### 2.3.1 Global CLI Service
- Installed via `npm install -g @randy888chan/stigmergy`
- Provides `stigmergy` command accessible from any directory
- Manages service lifecycle (start, stop, status)
- Handles project initialization
- Follows Trae Agent's model of a standalone CLI with global availability
- Implements proper daemon management for background service operation

#### 2.3.2 Project-Level Configuration
- Local `.stigmergy/` directory in each project
- Contains project-specific configuration and settings
- Stores trajectory logs and evaluation results
- Maintains project state and preferences

#### 2.3.3 Engine Service
- WebSocket-based server running on a fixed port (e.g., 3010)
- Processes agent requests and orchestrates workflows
- Manages state through GraphStateManager
- Interfaces with LLM providers and tools
- Implements cost tracking per project context
- Provides real-time cost monitoring via API endpoints
- Integrates with existing `engine/llm_adapter.js` cost tracking functionality

#### 2.3.4 IDE Integration Layer
- Single MCP server endpoint for all IDEs
- Standardized communication protocol
- Real-time project status updates
- Bidirectional messaging capabilities
- Operates on port 3010 by default (similar to Trae Agent's approach)
- Supports project context switching without service restart

## 3. Component Architecture

### 3.1 CLI Interface

#### 3.1.1 Commands Structure
```
stigmergy
├── start          # Start the global Stigmergy service
├── stop           # Stop the global Stigmergy service
├── status         # Check service status
├── init           # Initialize Stigmergy in current project
├── install        # Deprecated command (shows migration message)
├── config         # Manage global and project configuration
├── logs           # View service logs
├── benchmark      # Run benchmark evaluation suite
└── interactive    # Interactive mode for direct commands
```

#### 3.1.2 Command Implementation

**start**: Launches the Stigmergy engine as a background service
- Binds to port 3010 by default
- Loads global configuration from `~/.stigmergy/`
- Initializes state management systems
- Starts WebSocket server for IDE communication
- Similar to Trae Agent's persistent service model
- Supports daemon mode for background operation

**stop**: Stops the running Stigmergy service
- Gracefully shuts down all connections
- Persists any pending state changes
- Cleans up temporary resources

**status**: Checks if the Stigmergy service is running
- Reports service status and port information
- Shows active project contexts
- Displays resource utilization

**init**: Creates project-level configuration
- Generates `.stigmergy/` directory in current project
- Creates default `config.js` and `.env` files
- Sets up trajectory logging directory
- Initializes project-specific state
- Similar to `git init` in operation and purpose
- Supports both interactive and CLI modes for configuration

**config**: Manages configuration at both levels
- `stigmergy config --global` - Edit global settings
- `stigmergy config --project` - Edit project settings
- `stigmergy config --list` - Show current configuration
- Supports both interactive and CLI modes
- Follows Trae Agent's YAML-based configuration approach
- Supports environment variable overrides
- Provides configuration validation and error reporting

### 3.2 Engine Service

#### 3.2.1 Core Components

The Engine Service operates similar to Trae Agent's architecture with a persistent service that can be targeted at different project directories.

**State Management**:
- Uses GraphStateManager with Neo4j fallback
- Maintains separate state per project context
- Implements state persistence and recovery
- Provides real-time state updates via WebSocket

**Agent Orchestration**:
- Loads agents from both global and project contexts
- Implements dispatcher agent for task coordination
- Supports evaluator agent for solution assessment
- Manages agent communication and protocols

**Tool Execution**:
- Context-aware tool execution based on project directory
- Permission management for file system operations
- Integration with trajectory recording
- Cost tracking for LLM operations

#### 3.2.2 Service Lifecycle

```
[Start Service] → [Load Global Config] → [Initialize State Manager] 
      ↓
[Start WebSocket Server] → [Listen for IDE Connections] 
      ↓
[Wait for Project Context] → [Load Project Config] 
      ↓
[Process Agent Requests] ↔ [Execute Tools] ↔ [Update State]
      ↓
[Record Trajectories] → [Track Costs] → [Run Evaluations]
```

### 3.3 Project Configuration

#### 3.3.1 Directory Structure
```
.stigmergy/
├── config.js          # Project-specific configuration
├── .env               # Environment variables
├── trajectories/      # Trajectory logs
│   ├── trajectory_1.json
│   └── trajectory_2.json
├── evaluations/       # Benchmark results
│   └── results.json
└── state/             # Project state snapshots
    └── latest.json
```

#### 3.3.2 Configuration Hierarchy
1. Global Configuration (`~/.stigmergy/config.js`)
2. Project Configuration (`./.stigmergy/config.js`)
3. Environment Variables
4. Default Values

### 3.4 IDE Integration

#### 3.4.1 MCP Server
- Single endpoint running on `localhost:3010/mcp`
- Handles requests from all connected IDEs
- Manages project context switching
- Provides standardized tool interfaces

#### 3.4.2 Communication Flow
```
IDE → MCP Server → Engine Service → Agent Processing 
                     ↓
                Tool Execution ←→ File System (Project Context)
                     ↓
                State Updates → IDE (Real-time)
```

## 4. API Endpoints Reference

### 4.1 Engine API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send chat messages to agents |
| `/api/cost` | GET | Retrieve cost tracking data |
| `/api/state` | GET | Get current system state |
| `/api/state` | POST | Update system state |
| `/api/agents/{id}` | GET | Get agent definition |
| `/api/tools/{name}` | POST | Execute specific tool |

### 4.2 WebSocket Interface

#### 4.2.1 Events from Server
- `stateUpdate` - System state changes
- `agentResponse` - Agent responses to requests
- `toolResult` - Results from tool execution
- `costUpdate` - Real-time cost tracking
- `logMessage` - System logging information

#### 4.2.2 Events from Client
- `chatMessage` - User messages to agents
- `toolRequest` - Requests to execute tools
- `stateQuery` - Requests for current state
- `projectSwitch` - Change active project context

### 4.3 Authentication Requirements
- No authentication required for local development
- All communication restricted to localhost
- Project context determines file access permissions
- API keys managed through environment variables

## 5. Data Models & State Management

### 5.1 State Schema

```javascript
{
  project_name: "MyProject",
  project_status: "ACTIVE",
  project_manifest: {
    tasks: [
      {
        id: "task-1",
        description: "Implement user authentication",
        status: "PENDING",
        assigned_agent: "developer"
      }
    ]
  },
  system_time: "2023-01-01T00:00:00Z",
  performance: {
    agent_response_times: [],
    tool_execution_times: []
  },
  context: {
    project_directory: "/path/to/current/project",
    active_agent: "dispatcher"
  }
}
```

### 5.2 Trajectory Recording Model

```javascript
{
  id: "uuid-123",
  taskId: "agent_developer",
  startTime: "2023-01-01T00:00:00Z",
  endTime: "2023-01-01T00:05:00Z",
  events: [
    {
      id: "event-1",
      timestamp: "2023-01-01T00:00:01Z",
      type: "llm_interaction",
      data: { /* LLM call details */ }
    }
  ],
  context: {
    agentId: "developer",
    userPrompt: "Create a login form"
  },
  finalState: { /* Final system state */ }
}
```

### 5.3 ORM Mapping
- GraphStateManager for Neo4j integration
- File-based storage for trajectory logs
- JSON serialization for configuration files
- In-memory caching for performance optimization

## 6. Business Logic Layer

### 6.1 Core Protocols

#### 6.1.1 STATE_DRIVEN_ORCHESTRATION_PROTOCOL
- Implements GRAND_BLUEPRINT_PHASE for solution generation
- Delegates to evaluator agent for solution selection
- Coordinates multi-agent workflows
- Manages task dependencies and execution order
- Operates context-aware based on project directory
- Integrates with existing `.stigmergy-core/agents/dispatcher.md` functionality
- Fully implements the evaluator agent delegation as specified in requirements

#### 6.1.2 TRAJECTORY_RECORDING_PROTOCOL
- Records all LLM interactions per project context
- Logs tool execution details with full context
- Tracks state transitions across sessions
- Stores error conditions and recovery actions
- Saves logs to project-specific `.stigmergy/trajectories/` directory

#### 6.1.2 TRAJECTORY_RECORDING_PROTOCOL
- Records all LLM interactions
- Logs tool execution details
- Tracks state transitions
- Stores error conditions and recovery actions
- Saves logs to project-specific `.stigmergy/trajectories/` directory
- Integrates with existing `services/trajectory_recorder.js` functionality
- Provides detailed execution auditing for debugging and analysis

#### 6.1.3 COST_MONITORING_PROTOCOL
- Tracks LLM token usage
- Calculates costs per provider
- Maintains daily/weekly/monthly summaries
- Provides real-time cost updates

### 6.2 Agent Implementation

#### 6.2.1 Dispatcher Agent
- Analyzes system state to determine next actions
- Coordinates between specialized agents
- Implements fallback strategies
- Manages workflow progression

#### 6.2.2 Evaluator Agent
- Generates multiple solution approaches
- Evaluates solutions based on criteria
- Selects optimal solution for implementation
- Provides feedback for iterative improvement

### 6.3 Workflow Implementation

#### 6.3.1 Task Processing Flow
```
[User Request] → [Dispatcher Analysis] → [Agent Selection] 
       ↓
[Task Execution] → [Tool Usage] → [State Update] 
       ↓
[Trajectory Recording] → [Cost Tracking] → [Result Delivery]
```

#### 6.3.2 Evaluation Workflow
```
[Benchmark Trigger] → [Problem Loading] → [Environment Setup] 
        ↓
[Solution Generation] → [Validation Execution] → [Result Scoring] 
        ↓
[Report Generation] → [Performance Analysis] → [Feedback Loop]
```

#### 6.3.3 Benchmark Runner Implementation
- Executes problems from `evaluation/benchmark.json` in isolated environments
- Creates temporary project directories for each test case
- Validates solutions against success criteria
- Measures execution time, resource usage, and success rates
- Generates comprehensive reports in JSON and human-readable formats
- Integrates with existing `evaluation/runners/benchmark_runner.js` functionality

## 7. Middleware & Interceptors

### 7.1 Request Processing Middleware
- Context enrichment with project information
- Authentication and authorization checks
- Rate limiting for LLM API calls
- Request/response logging

### 7.2 State Management Interceptors
- State validation before updates
- Event broadcasting on state changes
- Conflict resolution for concurrent updates
- Backup and recovery mechanisms

### 7.3 Tool Execution Interceptors
- Permission validation for file operations
- Cost calculation before LLM calls
- Trajectory recording integration
- Error handling and recovery

## 8. Testing Strategy

### 8.1 Unit Testing

#### 8.1.1 CLI Command Tests
- Verify global installation and command availability
- Test project initialization workflow
- Validate configuration management
- Check service lifecycle operations
- Test backward compatibility with deprecated commands

#### 8.1.2 Engine Component Tests
- State management functionality
- Agent loading and execution
- Tool execution with context awareness
- Trajectory recording accuracy
- Cost tracking precision
- Multi-project context switching

#### 8.1.3 Service Integration Tests
- WebSocket communication
- API endpoint responses
- IDE integration protocols
- Multi-project context switching
- Cross-platform compatibility (Windows, macOS, Linux)
- Permission and security boundary testing

### 8.2 Integration Testing

#### 8.2.1 End-to-End Workflows
- Full task execution from IDE to completion
- Multi-agent coordination scenarios
- Error recovery and fallback handling
- Performance under load testing

#### 8.2.2 Cross-Language Support
- Python project integration
- Java project integration
- Go project integration
- Language-agnostic tool execution

### 8.3 Benchmark Testing

#### 8.3.1 Performance Benchmarks
- Agent response time measurements
- Tool execution performance
- State update latency
- Memory consumption analysis

#### 8.3.2 Evaluation Suite
- Automated problem solving tests
- Solution quality assessment
- Cross-model comparison
- Regression detection

#### 8.3.3 Integration Tests
- CLI command functionality verification
- Service lifecycle management
- Cross-platform compatibility
- Multi-language project support

## 9. Conclusion

This architectural transformation will position Stigmergy as a truly universal AI development tool that can operate on any project regardless of programming language. By adopting a standalone service model similar to professional development tools like Docker and language servers, Stigmergy will:

1. **Unlock Universal Applicability**: Work with Python, Java, Go, and other language projects
2. **Improve Developer Experience**: Provide a consistent global interface without project-level dependencies
3. **Maintain Advanced Features**: Preserve all existing functionality including trajectory recording, evaluation, and cost monitoring
4. **Follow Industry Best Practices**: Adopt the same architectural patterns used by successful tools like Trae Agent

The implementation follows a phased approach that ensures backward compatibility while enabling the new capabilities. This design enables Stigmergy to become a professional-grade AI development assistant that can integrate with any development environment through standardized protocols.