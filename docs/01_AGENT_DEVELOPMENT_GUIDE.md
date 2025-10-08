# Agent Development Guide

This guide explains how to create and configure new agents for the Stigmergy system.

## Agent Definition File Structure

Each agent is defined by a Markdown file (`.md`) located in the `.stigmergy-core/agents/` directory. The file must contain a YAML code block that defines the agent's behavior.

### Agent Configuration Block

The agent's configuration is defined in a `yaml` fenced code block. The system prompt sent to the AI model is constructed directly from the `persona` and `core_protocols` fields. **Any content outside of this YAML block is ignored.**

```markdown
```yaml
agent:
  persona:
    identity: "A helpful assistant that specializes in a specific task."
    role: "Performs a specific function within the Stigmergy ecosystem."
    style: "Communicates in a clear, concise, and professional manner."
  core_protocols:
    - "Protocol 1: Always be helpful."
    - "Protocol 2: Follow instructions precisely."
```

**Fields:**

*   `agent.persona`: An object describing the agent's personality and purpose. The `identity`, `role`, and `style` fields are concatenated to form the base system prompt.
    *   `identity`: A brief description of who the agent is.
    *   `role`: The agent's specific role or function in the system.
    *   `style`: The communication style of the agent.
*   `agent.core_protocols`: A list of core principles or rules that the agent must always follow. These are appended to the system prompt as a list of high-level directives.

**Note on Ignored Fields:** Fields such as `name`, `model_tier`, and `tools` are currently not processed by the engine and should not be included. Tool access and model selection are configured globally.

## Example

Here is a complete, valid example of an agent definition file for a "planner" agent.

**File: `.stigmergy-core/agents/planner.md`**
```markdown
```yaml
agent:
  id: "@planner"
  name: "Planner Agent"
  persona:
    identity: "I am a meticulous planning agent."
    role: "My role is to break down complex goals into a step-by-step plan, saving it to a `plan.md` file."
    style: "I communicate with clarity, precision, and a focus on actionable steps."
  core_protocols:
    - "Always create a plan.md file."
    - "Ensure the plan is detailed and covers all aspects of the user's request."
    - "Do not execute the plan, only create it."
```
