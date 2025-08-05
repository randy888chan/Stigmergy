# How to Create Custom Agents in Stigmergy

Stigmergy's power lies in its flexible swarm of AI agents. You can easily create your own agents to perform specialized tasks tailored to your project's unique needs. This guide will walk you through the process of creating, defining, and integrating a new agent into the system.

## 1. Understanding the Agent Manifest

All agents are defined in a single YAML file located at `.stigmergy-core/system_docs/02_Agent_Manifest.md`. This file contains an array of agent definitions. To create a new agent, you simply add a new entry to this list.

## 2. The Anatomy of an Agent

Each agent is defined as a YAML object with several key properties. Let's break down each one:

```yml
- id: "my_new_agent"
  alias: "sparky"
  name: "Sparky (My New Agent)"
  archetype: "Executor"
  title: "Specialized Task Performer"
  icon: "💡"
  persona:
    role: "A specialist in doing one thing very well."
    style: "Efficient, precise, and focused."
    identity: "I am Sparky. I receive a task and I execute it perfectly."
  tools:
    - file_system.readFile
    - my_custom_tool.doSomething
```

### Key Fields Explained:

- **`id` (Required)**: A unique, machine-readable identifier for the agent. Use snake_case. This ID is used internally to dispatch tasks to the agent.
- **`alias` (Optional)**: A short, memorable nickname for the agent.
- **`name` (Required)**: The full, human-readable name of the agent. It's often helpful to include the alias in parentheses.
- **`archetype` (Optional)**: The agent's general category. Common archetypes include:
  - `Planner`: For agents that create plans and strategies.
  - `Executor`: For agents that perform concrete tasks like writing code.
  - `Verifier`: For agents that check work, run tests, or perform quality assurance.
  - `Responder`: For agents that react to specific events, like errors.
- **`title` (Optional)**: A brief, descriptive title for the agent's role.
- **`icon` (Optional)**: An emoji to visually represent the agent in logs and UIs.
- **`persona` (Optional)**: An object that defines the agent's personality and communication style. This is crucial for guiding the LLM's behavior.
  - `role`: A concise description of the agent's function.
  - `style`: The agent's manner of communication (e.g., "formal", "technical", "creative").
  - `identity`: A first-person statement that captures the agent's core purpose.
- **`tools` (Required)**: A list of tools the agent is permitted to use. This is a critical security and control feature.
  - Tools are specified in the format `namespace.functionName`, e.g., `file_system.writeFile`.
  - You can use wildcards to grant access to an entire namespace, e.g., `file_system.*`.
  - **Important**: Grant only the permissions your agent absolutely needs to perform its function (Principle of Least Privilege).

## 3. Creating a Custom Tool (Optional)

Often, a new agent is created to use a new, custom tool. If you need to create a new tool:

1.  Create a new JavaScript file in the `tools/` directory (e.g., `tools/my_custom_tool.js`).
2.  Define and export an `async` function for your tool.
3.  Import your new tool file into `engine/tool_executor.js`.
4.  Add your tool to the `toolbelt` object in `engine/tool_executor.js` with a unique namespace.

Example `tools/my_custom_tool.js`:

```javascript
export async function doSomething({ parameter }) {
  // Your custom logic here
  return `Did something with ${parameter}`;
}
```

## 4. Step-by-Step: Creating a "Documentation Writer" Agent

Let's create an agent whose only job is to read code files and write documentation for them.

**Step 1: Define the Agent in the Manifest**

Open `.stigmergy-core/system_docs/02_Agent_Manifest.md` and add the following YAML block to the `agents` list:

```yml
- id: "doc_writer"
  alias: "scribe"
  name: "Scribe (Doc Writer)"
  archetype: "Executor"
  title: "Code Documentation Specialist"
  icon: "✍️"
  persona:
    role: "A technical writer who specializes in generating clear, concise documentation from source code."
    style: "Clear, informative, and structured."
    identity: "I am Scribe. I read code and produce high-quality documentation to explain it."
  tools:
    - file_system.readFile # To read the source code
    - file_system.writeFile # To write the documentation file
```

**Step 2: Use the Agent**

That's it! The agent is now available to the system. The `@dispatcher` agent can now delegate tasks to `@doc_writer` if it determines that a documentation task is required. You could also interact with it directly via the chat API or other interfaces.

By following this guide, you can extend Stigmergy with a diverse team of specialized agents, making the system more powerful and adaptable to any development workflow.
