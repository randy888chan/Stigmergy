# 🚀 Stigmergy - Autonomous AI Development System

> **The world's first truly autonomous development system with reference-first architecture and natural language chat interface**

**Note: Stigmergy now supports a new standalone service architecture that enables global installation and cross-language project support. See [Standalone Service Architecture](#standalone-service-architecture) for details.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.x-blue.svg)](https://neo4j.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#testing)

Stigmergy transforms high-level product goals into production-ready code through autonomous AI agents, reference pattern discovery, and intelligent workflow orchestration. Built for developers who want to focus on vision while AI handles implementation.

## 🔒 Security-First Architecture

Stigmergy is built with a security-first architecture to ensure a safe and stable development environment. This is achieved through several key protections:

- **Immutable Core**: The primary `.stigmergy-core` directory, containing all core agent definitions and system files, is bundled as a read-only asset within the globally installed NPM package. This prevents accidental or malicious modification of core system components.
- **Isolated Test Environment**: The test framework is hardened to prevent any interaction with the real `.stigmergy-core` or user data. Each test worker creates a temporary, isolated copy of the core assets in a `.stigmergy-core-test-temp-${JEST_WORKER_ID}` directory, which is safely deleted after the test run.
- **Resilient Shell Executor**: The shell tool has been rewritten to use the built-in `child_process.exec`. It no longer uses the insecure `vm` module. All shell command executions are sandboxed and wrapped in a `try...catch` block, ensuring that command failures (e.g., command not found, execution errors) are gracefully handled and returned as formatted error strings, rather than crashing the engine.
- **Hierarchical Agent Loading**: The engine uses a safe, prioritized loading strategy. It first checks for a local agent override in the project's `.stigmergy-core/agents` directory. If no local version is found, it safely falls back to the immutable, globally installed agent definition. This allows for project-specific customization without risking the integrity of the core system.

## ✨ What Makes Stigmergy Unique

### 🧠 **Reference-First Architecture**
- **Document Intelligence**: Processes PDFs, DOCX, and technical specs with AI-powered semantic segmentation
- **Pattern Discovery**: Indexes GitHub repositories to find proven code patterns and best practices
- **Technical Implementation Briefs**: AI generates detailed implementation guides with real code examples
- **Quality Assurance**: Built-in TDD enforcement, static analysis, and pattern compliance verification

### 💬 **Natural Language Interface**
- **Chat Commands**: Replace complex CLI operations with simple chat - "setup neo4j", "index github repos", "create auth system"
- **Intelligent Setup**: Automated configuration of databases, APIs, and development environment
- **Contextual Suggestions**: Smart command recommendations based on your project state
- **IDE Integration**: Seamless integration with VS Code, Roo Code, and other IDEs supporting MCP

### 🤖 **Autonomous Agent Swarm**
- **@reference-architect**: Analyzes documents and creates implementation briefs
- **@unified-executor**: Intelligently routes tasks to optimal execution methods
- **@system**: Universal gateway handling all external communications
- **Enhanced QA**: Test-driven development enforcement with comprehensive quality checks

## 🏗️ Standalone Service Architecture

Stigmergy now supports a new standalone service architecture that enables:

- **Global Installation**: Install once, use everywhere
- **Cross-Language Support**: Works with Python, Java, Go, and any language
- **No Project Duplication**: Core system files remain in global installation
- **Backward Compatibility**: Existing projects continue to work
- **Enhanced Security**: Immutable core assets protect against accidental modification

### How It Works

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
          │  ┌────────────────────────────────┐ │
          │  │   Immutable .stigmergy-core    │ │
          │  │    (Read-Only Bundle)          │ │
          │  └────────────────────────────────┘ │
          └─────────────────┬───────────────────┘
                            │
          ┌─────────────────▼───────────────────┐
          │         IDE Integration             │
          │  (VS Code, Roo Code, Cursor, etc.)  │
          └─────────────────────────────────────┘
```

### Key Benefits

1. **Install Once, Use Everywhere**: Global installation eliminates the need to install Stigmergy in every project
2. **Cross-Language Support**: Works with any programming language - Python, Java, Go, etc.
3. **No Duplication**: Lightweight project initialization prevents duplicating the full system in each repository
4. **Backward Compatibility**: Existing projects with `.stigmergy-core` continue to work without changes
5. **Enhanced Security**: Immutable core assets protect against accidental modification or deletion

### Migration Path

- **New Projects**: Use `stigmergy init` for lightweight initialization
- **Existing Projects**: Use `stigmergy init` to migrate to the new structure

## 🚀 Quick Start (2 minutes)

The recommended way to use Stigmergy is by installing it globally. This provides a standalone service that can work with any project on your system, regardless of the programming language.

```bash
# 1. Install Stigmergy globally (one-time setup)
npm install -g @randy888chan/stigmergy

# 2. Start the global Stigmergy service
stigmergy start-service

# 3. Initialize Stigmergy in your project directory
cd /path/to/your/project
stigmergy init

# 4. Connect your IDE
# Configure your IDE's MCP (Model-Context-Protocol) client to connect to the Stigmergy service at:
# http://localhost:3010
```

Once connected, you can start interacting with Stigmergy using natural language commands directly from your IDE's chat interface.

---

## 💬 Chat Interface Commands

Replace all complex CLI operations with natural language:

### 🔧 Setup & Configuration
```
"setup neo4j"               # Configure database
"configure environment"      # Setup API keys
"install dependencies"       # Run npm install
"health check"              # System diagnostics
```

### 📚 Reference Pattern Management
```
"index github repos"        # Build reference library
"scan local codebase"       # Index current project
"update patterns"           # Refresh pattern database
"show available patterns"   # List indexed patterns
```

### 🛠️ Development Tasks
```
"create authentication system"     # Build secure auth
"implement JWT middleware"         # Specific components
"optimize database queries"       # Performance improvements
"add user registration"           # Feature additions
"create REST API for users"       # Full system components
```

### 🔍 System Management
```
"validate system"           # Check configuration
"show status"              # Current system state
"restart services"         # System restart
"what can I do?"           # Get suggestions
```

## 🔧 CLI Commands

Stigmergy provides powerful CLI commands for easy setup and management:

### Global Service Commands
These commands are available anywhere in your terminal after the global installation.

```bash
# Install Stigmergy globally (one-time setup)
npm install -g @randy888chan/stigmergy

# Start the global Stigmergy service in the background
stigmergy start-service

# Stop the global Stigmergy service
stigmergy stop-service

# Check the status of the global service
stigmergy service-status
```

### Project Commands
These commands should be run inside your project's directory.

```bash
# Initialize a new or existing project for use with Stigmergy
# This creates a local .stigmergy/ directory for configuration and overrides.
stigmergy init

# Interactively initialize the project with guided setup
stigmergy init --interactive

# Validate agent definitions (checks local .stigmergy/agents/ first, then global)
stigmergy validate

# Build web bundles for the project
stigmergy build
```

### Web Bundle Commands
```bash
# Build optimized agent bundles for web-based AI assistants
stigmergy build
```

Web bundles are optimized collections of Stigmergy agents designed for use with web-based AI assistants like ChatGPT and Gemini. These bundles contain specialized agent personas that can be used to fulfill high-level goals through iterative, multi-step prompting.

**Best Practices for Web Bundle Usage:**
- Use smaller, specialized teams (`team-web-planners.yml`, `team-execution.yml`) for focused tasks
- Adopt agent personas explicitly by announcing "Now acting as @agent-name..." before beginning a task
- Switch personas as the conversation requires (e.g., planning as @business_planner, then technical details as @design-architect)
- Approach complex tasks iteratively with multi-step prompting rather than trying to solve everything at once

## 🏗️ Reference-First Development Workflow

### 1. **Document Analysis** 📄
```bash
# Upload technical specs, requirements, or documentation
# Stigmergy automatically:
# - Extracts requirements and constraints
# - Preserves code examples and algorithms
# - Identifies key technical concepts
```

### 2. **Pattern Discovery** 🔍
```bash
# Searches indexed repositories for relevant patterns:
# - Authentication implementations
# - Database patterns
# - API design examples
# - Security best practices
```

### 3. **Implementation Brief Creation** 📋
```bash
# AI generates comprehensive technical briefs:
# - Adapted code snippets from proven repositories
# - Architecture recommendations
# - Step-by-step implementation guidance
# - Testing strategies and quality checks
```

### 4. **Intelligent Execution** ⚡
```bash
# Smart routing based on:
# - Task complexity (algorithms → Qwen CLI)
# - Standard patterns (CRUD → Gemini CLI)
# - Integration needs (complex → Enhanced Dev)
# - Quality requirements (TDD enforcement)
```

## 🎯 Key Features

### 🧩 **Multi-Executor Architecture**
- **Internal Dev**: Context-aware development with full codebase understanding
- **Gemini CLI**: Fast generation for standard patterns and boilerplate
- **Qwen CLI**: Advanced algorithms and mathematical operations
- **Intelligent Routing**: Automatic selection based on task requirements

### 🛡️ **Quality Assurance**
- **TDD Enforcement**: Tests must be written before implementation
- **Static Analysis**: ESLint integration for code quality
- **Pattern Compliance**: Verification against reference implementations
- **Coverage Analysis**: Minimum 80% test coverage requirement

### 🔗 **IDE Integration**
- **Universal MCP Server**: Works in any project directory without manual configuration
- **VS Code**: Native integration through Continue extension with MCP protocol
- **Roo Code**: Native integration with automatic setup via `stigmergy init`
- **Auto-detection**: Intelligent project context detection and port management
- **MCP Protocol**: Model-Context Protocol for seamless IDE communication
- **Structured Responses**: JSON-formatted status updates and coordination
- **File Tracking**: Real-time monitoring of modified and created files
- **Natural Language**: Use simple commands through your IDE for project coordination


### 🧠 **Code Intelligence**
- **Neo4j Knowledge Graph**: Deep codebase understanding
- **Semantic Search**: Find relevant code patterns and examples
- **Architectural Analysis**: Pattern detection and recommendations
- **Impact Analysis**: Understand change implications

## 📊 System Architecture

```
graph TB
    User[🧑 User] --> System[🎯 @system]
    System --> Chat[💬 Chat Interface]
    System --> RefArch[📚 @reference-architect]
    System --> Unified[🎯 @unified-executor]
    
    RefArch --> DocIntel[📄 Document Intelligence]
    RefArch --> PatternSearch[🔍 Pattern Search]
    RefArch --> Brief[📋 Implementation Brief]
    
    Unified --> InternalDev[🔧 @enhanced-dev]
    Unified --> GeminiCLI[⚡ @gemini-executor]
    Unified --> QwenCLI[🧮 @qwen-executor]
    
    InternalDev --> QA[🛡️ @qa]
    GeminiCLI --> QA
    QwenCLI --> QA
    
    QA --> TDD[✅ TDD Enforcement]
    QA --> Static[🔍 Static Analysis]
    QA --> Coverage[📊 Coverage Check]
    
    subgraph "Data Layer"
        Neo4j[(🗃️ Neo4j)]
        Patterns[(📚 Pattern Library)]
        GitHub[(🐙 GitHub Repos)]
    end
    
    DocIntel --> Patterns
    PatternSearch --> GitHub
    InternalDev --> Neo4j
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Core AI Providers
GOOGLE_API_KEY=your_google_api_key          # Required for AI operations
GITHUB_TOKEN=your_github_token              # Required for pattern indexing

# Database (Optional - graceful degradation)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Alternative Providers (Optional)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Model Tiers Configuration
```javascript
// stigmergy.config.js
export default {
  model_tiers: {
    reasoning_tier: {        // Strategic planning
      model_name: "gemini-2.0-flash-thinking-exp"
    },
    execution_tier: {        // Code generation
      model_name: "gemini-1.5-flash"
    },
    utility_tier: {          // Simple tasks
      model_name: "gemini-1.5-flash-8b"
    }
  }
};
```

## 🧪 Testing

### Run All Tests
```bash
npm test                           # Full test suite
npm run test:unit                  # Unit tests only
npm run test:integration           # Integration tests
npm run coverage                   # Coverage report
```

### Test Specific Components
```bash
npm run test:reference-architecture   # Reference-first workflow
npm run test:simple-reference         # Basic pattern discovery
npm run chat:test                     # Chat interface
npm run qa:comprehensive              # Quality assurance
```

### Health Checks
```bash
npm run health-check              # Full system diagnostic
npm run validate                  # Agent validation
npm run setup:complete            # Complete setup verification
```

## 📚 Documentation

- **[System Architecture](docs/architecture.md)** - Deep dive into system design
- **[MCP Integration Guide](docs/MCP_INTEGRATION.md)** - Universal IDE integration setup
- **[Agent Development](docs/agents.md)** - Creating custom agents
- **[Tool Integration](docs/tools.md)** - Adding new tools
- **[Reference Patterns](docs/patterns.md)** - Pattern indexing and discovery
- **[Quality Assurance](docs/qa.md)** - TDD and quality standards
- **[IDE Integration](docs/ide.md)** - VS Code, Roo Code and MCP setup

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
git clone https://github.com/randy888chan/stigmergy.git
cd stigmergy
npm install
stigmergy init
npm run health-check
```

### Code Standards
- **TDD Required**: All new features must include tests
- **ESLint Compliance**: Code must pass static analysis
- **Pattern Documentation**: Reference implementations for new patterns
- **Chat Commands**: All CLI operations should have chat equivalents

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔮 Roadmap

- **Q1 2024**: Multi-language support (Python, Java, Go)
- **Q2 2024**: Visual design integration with Figma/Sketch
- **Q3 2024**: Team collaboration features
- **Q4 2024**: Enterprise deployment options

## 💡 Philosophy

> "The best code is not written from scratch - it's intelligently adapted from proven patterns."

Stigmergy embodies the principle that great software development should focus on:
1. **Understanding** what needs to be built
2. **Discovering** how others have solved similar problems
3. **Adapting** proven solutions to specific needs
4. **Ensuring** quality through systematic verification

---

<div align="center">
  <strong>Ready to revolutionize your development workflow?</strong><br>
  <code>npm install -g @randy888chan/stigmergy</code><br>
  <code>stigmergy start-service</code><br>
  Then, in your project: <code>stigmergy init</code><br>
  Configure your IDE to connect to the global service at <code>http://localhost:3010</code> and start coordinating!
</div>
