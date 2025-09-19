# Agent Development Guide

This guide explains how to create and configure new agents for the Stigmergy system.

## Agent Definition File Structure

Each agent is defined by a Markdown file (`.md`) located in the `.stigmergy-core/agents/` directory. These files have a specific structure consisting of a YAML frontmatter block and a Markdown body.

### YAML Frontmatter

The YAML frontmatter is a block of YAML at the very top of the file, enclosed in triple-dashed lines (`---`). It defines the core configuration of the agent.

```yaml
agent:
  name: My New Agent
  persona:
    identity: "A helpful assistant that specializes in a specific task."
    role: "Performs a specific function within the Stigmergy ecosystem."
    style: "Communicates in a clear, concise, and professional manner."
  model_tier: "b_tier" # or 'a_tier', 's_tier', 'utility_tier', etc.
  tools:
    - "core.log"
    - "my_custom_tool.do_something"
  core_protocols:
    - "Protocol 1: Always be helpful."
    - "Protocol 2: Never reveal your secret identity."
```

**Fields:**

*   `agent.name`: The display name of the agent.
*   `agent.persona`: An object describing the agent's personality and purpose.
    *   `identity`: A brief description of who the agent is.
    *   `role`: The agent's specific role or function in the system.
    *   `style`: The communication style of the agent.
*   `agent.model_tier`: The tier of the language model the agent should use. This determines the model's capabilities and cost. See `stigmergy.config.js` for tier definitions.
*   `agent.tools`: A list of tools the agent is permitted to use. The format is `<tool_filename>.<function_name>`.
*   `agent.core_protocols`: A list of core principles or rules that the agent must always follow. These are high-level directives that guide the agent's behavior.

### Markdown Body

The content below the YAML frontmatter is the main prompt or instruction set for the agent. This is where you provide the detailed instructions, context, and examples the agent needs to perform its task. This content is used as the system prompt for the language model.

## Example

Here is a complete example of an agent definition file:

```markdown
---
agent:
  name: Greeter
  persona:
    identity: "A friendly agent that greets users."
    role: "To provide a warm welcome to users interacting with the system."
    style: "Friendly, welcoming, and slightly informal."
  model_tier: "utility_tier"
  tools:
    - "core.log"
  core_protocols:
    - "Always greet the user by name if it is known."
    - "Keep greetings short and to the point."
---

You are a friendly greeter agent. Your job is to welcome users to the Stigmergy system. When triggered, you should respond with a warm and welcoming message.
```
