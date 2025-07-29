# Contributing to Stigmergy

Thank you for your interest in contributing to the Stigmergy project! We welcome improvements from the community. Here are the guidelines for extending the system.

## How to Add a New Agent

Adding a new agent to the swarm is a two-step process.

**Step 1: Create the Agent Definition File**

1.  Create a new Markdown file in `.stigmergy-core/agents/`. The filename should be the agent's unique ID (e.g., `my_new_agent.md`).
2.  Define the agent's configuration in a `yaml` block, including its `id`, `alias`, `name`, `archetype`, and `icon`.
3.  Write the agent's `persona` and `core_protocols`. Focus on how the agent reacts to system state, not user commands.

**Step 2: Register the Agent in the Manifest**

1.  Open `.stigmergy-core/system_docs/02_Agent_Manifest.md`.
2.  Add a new entry to the `agents` list, specifying its `id`, `alias`, `tools`, and any `permitted_shell_commands`.

## How to Add a New Tool

**Step 1: Create the Tool Module**

1.  Create a new JavaScript file in the `tools/` directory (e.g., `my_new_tool.js`).
2.  The module should export one or more asynchronous functions.

**Step 2: Register the Tool in the Toolbelt**

1.  Open `engine/tool_executor.js`.
2.  Import your new tool module and add it to the `toolbelt` object.

### Tooling Best Practices

Stigmergy uses several patterns for its tools. Understanding them is key to extending the system correctly.

**1. Standard Tools**
These are simple functions that perform a direct action and return a result, like `file_system.readFile`. They should be pure and stateless where possible.

**2. Tools that Request User Input**
If a tool requires a secret or API key that may not be in the `.env` file, it should **not** ask the user directly. Instead, it should throw a specific, custom error that the engine is designed to catch.

*   **Pattern:**
    ```javascript
    // in tools/research.js
    import FirecrawlApp from "@mendable/firecrawl-js";

    function getFirecrawlClient() {
      if (!process.env.FIRECRAWL_KEY) {
        const err = new Error("The research tool requires a Firecrawl API Key (FIRECRAWL_KEY).");
        err.name = "MissingApiKeyError";
        err.key_name = "FIRECRAWL_KEY";
        throw err;
      }
      return new FirecrawlApp({ apiKey: process.env.FIRECRAWL_KEY });
    }
    ```
*   **Engine Behavior:** The main loop in `engine/server.js` will catch `MissingApiKeyError` or `MissingSecretError`, pause the autonomous process, and send a request for the key to the user via the IDE.

**3. Internal System Tools**
The `system` and `stigmergy` namespaces are reserved for tools that interact with the engine's core lifecycle.
*   `system.approveExecution`: Called by the `@dispatcher` to signal user consent and resume the engine.
*   `stigmergy.createBlueprint`: A specialized tool used only by the `@meta` agent to generate executable improvement plans.

When adding new tools, consider these patterns to ensure they integrate seamlessly and robustly with the autonomous workflow.
