
# Contributing to Stigmergy

Thank you for your interest in contributing to the Pheromind Stigmergy project! We welcome improvements from the community. Here are the guidelines for common extension tasks.

## How to Add a New Agent

Adding a new agent to the swarm is a two-step process.

**Step 1: Create the Agent Definition File**

1.  Create a new Markdown file in `.stigmergy-core/agents/`. The filename should be the agent's unique ID (e.g., `my_new_agent.md`).
2.  Follow the structure of existing agents like `analyst.md`. Define the agent's configuration in a `yaml` block, including its `id`, `alias`, `name`, `archetype`, and `icon`.
3.  Write the agent's `persona`, `core_protocols`, and `commands` to give it a clear identity and purpose.

**Step 2: Register the Agent in the Manifest**

1.  Open `.stigmergy-core/system_docs/02_Agent_Manifest.md`.
2.  Add a new entry to the `agents` list.
3.  Specify the agent's `id`, `alias`, `archetype`, preferred `model_preference`, and the list of `tools` it is allowed to use.
4.  If the agent needs to execute shell commands, add the `permitted_shell_commands` list.

```yaml
# In 02_Agent_Manifest.md
- id: my_new_agent
  alias: my-alias
  archetype: Executor
  model_preference: "claude-3-haiku-20240307"
  tools: [file_system.readFile, shell.execute]
  permitted_shell_commands: ["ls -la", "npm install"]
```

## How to Add a New Tool

Adding a new tool for agents to use involves two steps.

**Step 1: Create the Tool Module**

1.  Create a new JavaScript file in the `tools/` directory (e.g., `my_new_tool.js`).
2.  The module should export an object containing one or more asynchronous functions. Each function represents a specific tool action.
3.  Ensure each function takes a single object (`{ args }`) as its parameter.

**Step 2: Register the Tool in the Toolbelt**

1.  Open `engine/tool_executor.js`.
2.  Import your new tool module at the top of the file.
3.  Add your tool to the `toolbelt` object, using its namespace as the key.

```javascript
// In engine/tool_executor.js
const myNewTool = require('../tools/my_new_tool'); // Step 1

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'my_new_tool': myNewTool, // Step 2
};
```

After these steps, any agent that has `'my_new_tool.yourFunction'` in its `tools` list in the manifest will be able to use it.
