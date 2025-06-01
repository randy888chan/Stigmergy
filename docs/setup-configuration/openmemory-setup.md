# OpenMemory MCP Setup Guide

BMad Method integrates with [OpenMemory MCP](https://mem0.ai/openmemory-mcp) to provide persistent memory and context management across AI tools. This guide will help you set up OpenMemory MCP for enhanced BMad Method functionality.

!!! tip "Enhanced Memory Capabilities"
    OpenMemory MCP enables BMad Method to remember past decisions, patterns, and lessons learned across sessions, dramatically improving the quality of recommendations and workflow efficiency.

## What is OpenMemory MCP?

[OpenMemory MCP](https://mem0.ai/openmemory-mcp) is a local application that stores, organizes, and manages memories with topics, emotions, and timestamps. It enables sharing memories across AI tools like Claude, Cursor, and Windsurf while keeping your data private and secure.

### Key Features

- **🔒 Privacy First**: All memories stored locally on your device
- **🔄 Cross-Tool Integration**: Works with Claude, Cursor, Windsurf, and other MCP-compatible clients
- **📊 Structured Memories**: Enriched with metadata like categories for easy searching
- **🎯 Permission-Based Access**: You control what AI tools can access
- **💾 Persistent Storage**: Memories survive across sessions and tool restarts

### BMad Method Integration Benefits

- **📚 Pattern Recognition**: Remember successful workflows and avoid past mistakes
- **🧠 Context Continuity**: Maintain project context across persona switches
- **🎯 Personalized Recommendations**: AI suggestions based on your past preferences
- **📈 Continuous Learning**: System gets smarter with every interaction
- **🤝 Team Memory**: Share insights and decisions across team members

## Installation

### Prerequisites

- **Node.js**: Version 16 or higher
- **Compatible AI Client**: Claude Desktop, Cursor, or Windsurf
- **BMad Method**: Already set up and configured

### Step 1: Install OpenMemory MCP

Follow the official installation instructions from the [OpenMemory GitHub repository](https://github.com/mem0ai/mem0/tree/main/openmemory):

```bash
# Clone the repository
git clone https://github.com/mem0ai/mem0.git
cd mem0/openmemory

# Install dependencies
npm install

# Build the application
npm run build
```

### Step 2: Configure MCP Client

Configure your AI client to use OpenMemory MCP. The exact steps vary by client:

#### For Claude Desktop

Add OpenMemory to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "node",
      "args": ["/path/to/mem0/openmemory/dist/index.js"],
      "env": {
        "OPENMEMORY_DATA_DIR": "/path/to/your/memory/data"
      }
    }
  }
}
```

#### For Cursor

Configure Cursor to use OpenMemory MCP by adding it to your MCP configuration file.

#### For Windsurf

Follow similar MCP configuration patterns for Windsurf integration.

### Step 3: Verify Installation

Test that OpenMemory MCP is working correctly:

1. **Start your AI client** (Claude Desktop, Cursor, etc.)
2. **Test memory creation**:
   ```
   /remember "This is a test memory for OpenMemory MCP setup"
   ```
3. **Test memory recall**:
   ```
   /recall "test memory"
   ```

If both commands work without errors, OpenMemory MCP is successfully configured.

## BMad Method Configuration

### Update BMad Configuration

The BMad Method automatically detects OpenMemory MCP availability. To ensure optimal integration:

1. **Verify memory provider setting** in `bmad-agent/ide-bmad-orchestrator.cfg.md`:
   ```yaml
   memory-provider: "openmemory-mcp"
   ```

2. **Check memory integration settings**:
   ```yaml
   memory-persistence: "hybrid"
   context-scope: "cross-session"
   auto-memory-creation: true
   proactive-surfacing: true
   ```

### Memory Categories

BMad Method uses specific memory categories for optimal organization:

- **`decisions`**: Important project and technical decisions
- **`patterns`**: Successful workflows and anti-patterns
- **`mistakes`**: Lessons learned from issues and failures
- **`handoffs`**: Context shared between persona transitions
- **`consultations`**: Multi-persona collaboration outcomes
- **`user-preferences`**: Your preferred approaches and styles
- **`quality-metrics`**: Quality assessment patterns and improvements
- **`udtm-analyses`**: Ultra-Deep Thinking Mode analysis results
- **`brotherhood-reviews`**: Peer review insights and feedback

## Usage with BMad Method

### Enhanced Commands

With OpenMemory MCP configured, BMad Method provides enhanced memory capabilities:

#### Core Memory Commands
```bash
/remember "key insight or decision"     # Store important information
/recall "search query"                  # Find relevant past memories
/context                               # Get enhanced context with memory insights
```

#### Memory-Enhanced Workflows
```bash
# Before starting work
/context                               # Check current state + memory insights
/recall "similar projects"             # Learn from past experience

# During work
/remember "Decision: chose React for team familiarity"
/handoff architect                     # Structured transition with memory

# After completion
/remember "Lesson learned: integration testing caught 3 major issues"
```

### Automatic Memory Creation

BMad Method automatically creates memories for:

- **Major decisions** made during UDTM analysis
- **Quality gate** outcomes and lessons learned
- **Persona handoffs** with context and reasoning
- **Brotherhood review** insights and feedback
- **Anti-pattern detection** and resolution approaches
- **Successful workflow patterns** and optimizations

## Troubleshooting

### Common Issues

#### OpenMemory MCP Not Detected

**Symptoms**: BMad Method shows "Memory provider: file-based" instead of "openmemory-mcp"

**Solutions**:
1. Verify OpenMemory MCP is running: Check your AI client's MCP server status
2. Check configuration paths: Ensure paths in MCP configuration are correct
3. Restart AI client: Sometimes a restart is needed to detect MCP servers
4. Test MCP connection: Try basic `/remember` and `/recall` commands

#### Memory Commands Not Working

**Symptoms**: `/remember` and `/recall` commands return errors

**Solutions**:
1. Verify MCP server status in your AI client
2. Check OpenMemory MCP logs for errors
3. Ensure proper permissions for data directory
4. Test with simple memory operations first

#### Slow Memory Operations

**Symptoms**: Memory search and recall take too long

**Solutions**:
1. Check memory database size and consider cleanup
2. Ensure adequate system resources (RAM, storage)
3. Update to latest OpenMemory MCP version
4. Consider memory retention policies

### Getting Help

If you encounter issues:

1. **Check BMad Method diagnostics**:
   ```bash
   /diagnose
   ```

2. **Verify OpenMemory status**:
   - Check MCP server logs in your AI client
   - Test basic memory operations
   - Verify data directory permissions

3. **Community Support**:
   - [OpenMemory GitHub Issues](https://github.com/mem0ai/mem0/issues)
   - [BMad Method GitHub Issues](https://github.com/danielbentes/DMAD-METHOD/issues)
   - [OpenMemory Documentation](https://mem0.ai/openmemory-mcp)

## Advanced Configuration

### Memory Retention Policies

Configure memory retention and cleanup policies:

```yaml
# In BMad configuration
memory-retention:
  default-ttl: 90d          # Default memory lifetime
  auto-cleanup: true        # Automatic cleanup of old memories
  categories:
    decisions: 365d         # Keep decisions for 1 year
    patterns: permanent     # Keep successful patterns permanently
    mistakes: 180d          # Keep lessons learned for 6 months
```

### Cross-Project Memory Sharing

Enable memory sharing across multiple projects:

```yaml
cross-project-learning: true
memory-scope: "global"      # Share insights across all projects
project-isolation: false   # Allow cross-project pattern recognition
```

### Team Memory Synchronization

For team environments, consider setting up shared memory spaces:

```yaml
team-memory:
  enabled: true
  shared-categories: ["patterns", "quality-metrics", "anti-patterns"]
  sync-frequency: "daily"
```

## Best Practices

### Memory Organization

1. **Use descriptive memories**: Include context and reasoning
   ```bash
   /remember "Architecture decision: Chose microservices over monolith due to team size (8 developers) and need for independent deployment cycles"
   ```

2. **Tag important patterns**:
   ```bash
   /remember "Successful pattern: Starting with /analyst before /pm improved requirements quality by 40%"
   ```

3. **Document mistakes with solutions**:
   ```bash
   /remember "Mistake: Skipped integration testing, caused 3-day deployment delay. Solution: Always run integration tests before merge"
   ```

### Workflow Integration

1. **Start sessions with memory review**:
   ```bash
   /context                    # Get current state + memory insights
   /recall "project challenges" # Learn from past issues
   ```

2. **Regular memory maintenance**:
   ```bash
   /recall "outdated patterns"  # Review and update old patterns
   /remember "Pattern update: New linting rules improved code quality"
   ```

3. **Share insights with team**:
   ```bash
   /remember "Team insight: Daily standups more effective with specific blockers discussion"
   ```

---

**Next Steps:**
- [Return to Setup & Configuration](index.md)
- [Explore Memory-Enhanced Workflows](../workflows/index.md)
- [Learn about Enhanced Commands](../commands/quick-reference.md) 