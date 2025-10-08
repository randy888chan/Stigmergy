# Tool Development Guide

This guide explains how to add new tools to the Stigmergy system and make them available to agents.

## Tool File Structure

Tools are defined in JavaScript files located in the `tools/` directory. Each file can export one or more functions that can be used as tools by agents.

### Tool Function

A tool function is an `async` function that takes an object of arguments as its first parameter. It should return a result that can be processed by the agent.

**Example:**

```javascript
// tools/my_custom_tool.js

/**
 * A brief description of what the tool does.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.message - The message to log.
 * @returns {Promise<string>} A confirmation message.
 */
export async function do_something({ message }) {
  console.log(`My custom tool says: ${message}`);
  return `Successfully logged message: "${message}"`;
}
```

It is good practice to include JSDoc comments to describe the tool and its parameters. This helps with documentation and can be used by future system enhancements.

### Exporting Tools

All tool functions must be exported from the module using `export`.

## Making Tools Available to Agents

Tools are automatically discovered by the engine, but they must be explicitly authorized for an agent to use them.

### 1. Automatic Discovery
The engine automatically loads all exported functions from JavaScript files within the `tools/` directory. You do not need to register them manually. The tool's name will be `<filename>.<function_name>`. For example, a function `do_something` exported from `my_custom_tool.js` will be available as the tool `my_custom_tool.do_something`.

### 2. Agent Authorization
For security, an agent can only use tools that are explicitly listed in its `engine_tools` configuration. This is done in the agent's YAML definition file (`.stigmergy-core/agents/<agent_name>.md`).

**Example:**

To grant an agent permission to use `file_system.readFile` and all tools from the `shell` module, you would configure it as follows:

```yaml
# .stigmergy-core/agents/my_agent.md

agent:
  # ... other properties
  engine_tools:
    - "file_system.readFile"
    - "shell.*" # Use a wildcard to grant access to all tools in the 'shell' namespace
```

The system will prevent an agent from executing any tool not listed in its `engine_tools` array.
