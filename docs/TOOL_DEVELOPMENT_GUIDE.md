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

## Granting Agents Permission

For an agent to be able to use a new tool, you must grant it permission in its agent definition file (`.stigmergy-core/agents/<agent_name>.md`).

In the YAML frontmatter of the agent's definition file, add the tool to the `tools` list. The format is `<tool_filename>.<function_name>`.

**Example:**

```yaml
# .stigmergy-core/agents/my_agent.md

agent:
  name: My Agent
  # ... other properties
  tools:
    - "core.log"
    - "my_custom_tool.do_something" # Grant permission to the new tool
```

Once you have added the tool to the agent's definition file, the agent will be able to call it during its execution cycle.
