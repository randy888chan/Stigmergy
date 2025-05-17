# Instructions

- [Web Agent Setup](#setting-up-web-mode-agents-in-gemini-gem-or-chatgpt-custom-gpt)
- [IDE Agent Setup](#ide-agent-setup)
- [Tasks Setup and Usage](#tasks)

## Setting up Agent Orchestrator

The Agent Orchestrator in V3 utilizes a build script to package various agent assets (personas, tasks, templates, etc.) into a structured format, primarily for use with web-based orchestrator agents that can leverage large context windows. This process involves consolidating files from specified source directories into bundled text files and preparing a main agent prompt.

### Overview

The build process is managed by the `build-bmad-orchestrator.js` Node.js script. This script reads its configuration from `build-agent-cfg.js`, processes files from an asset directory, and outputs the bundled assets into a designated build directory.

### Prerequisites

- **Node.js**: Ensure you have Node.js installed to run the build script. Python version coming soon...

### Configuration (`build-agent-cfg.js`)

The build process is configured via `build-agent-cfg.js`. Key parameters include:

- `orchestrator_agent_prompt`: Specifies the path to the main prompt file for the orchestrator agent. This file will be copied to `agent-prompt.txt` in the build directory.
  - Example: `./bmad-agent/orchestrator-agent.md`
- `asset_root`: Defines the root directory where your agent assets are stored. The script will look for subdirectories within this path.
  - Example: `./bmad-agent/` meaning it will look for folders like `personas`, `tasks` inside `bmad-agent/`)
- `build_dir`: Specifies the directory where the bundled output files and the `agent-prompt.txt` will be created.
  - Example: `./bmad-agent/build/`
- `agent_cfg`: Specifies the path to the YAML file that defines the agents the Orchestrator can embody.
  - Example: `./samples/orchestrator-agent-cfg.gemini.yaml`

Paths in the configuration file (`build-agent-cfg.js`) are relative to the `BETA-V3` directory (where `build-agent-cfg.js` and the build script `build-bmad-orchestrator.js` are located).

### Asset Directory Structure

The script expects a specific structure within the `asset_root` directory:

1.  **Subdirectories**: Create subdirectories directly under `asset_root` for each category of assets. Based on the `bmad-agent/` folder, these would be:
    - `checklists/`
    - `data/`
    - `personas/`
    - `tasks/`
    - `templates/`
2.  **Asset Files**: Place your individual asset files (e.g., `.md`, `.txt`) within these subdirectories.
    - For example, persona definition files would go into `asset_root/personas/`, task files into `asset_root/tasks/`, etc.
3.  **Filename Uniqueness**: Within each subdirectory, ensure that all files have unique base names (i.e., the filename without its final extension). For example, having `my-persona.md` and `my-persona.txt` in the _same_ subdirectory (e.g., `personas/`) will cause the script to halt with an error. However, `my-persona.md` and `another-persona.md` is fine.

### Running the Build Script

1.  **Navigate to the script's directory (optional but recommended for clarity)**:
    ```bash
    cd BETA-V3
    ```
2.  **Execute the script**:
    ```bash
    node build-bmad-orchestrator.js
    ```
    If you are in the workspace root, you would run:
    ```bash
    node BETA-V3/build-bmad-orchestrator.js
    ```

The script will log its progress, including discovered source directories, any issues found (like duplicate base filenames), and the output files being generated.

### Output

After running the script, the `build_dir` (e.g., `BETA-V3/bmad-agent/build/`) will contain:

1.  **Bundled Asset Files**: For each subdirectory processed in `asset_root`, a corresponding `.txt` file will be created in `build_dir`. Each file concatenates the content of all files from its source subdirectory.
    - Example: Files from `asset_root/personas/` will be bundled into `build_dir/personas.txt`.
    - Each original file's content within the bundle is demarcated by `==================== START: [base_filename] ====================` and `==================== END: [base_filename] ====================`.
2.  **`agent-prompt.txt`**: This file is a copy of the prompt specified by `orchestrator_agent_prompt` in the configuration.

These bundled files and the agent prompt are then ready to be used by the Agent Orchestrator.

### Orchestrator Agent Configuration (`BETA-V3/samples/orchestrator-agent-cfg.gemini.yaml`)

While the `build-bmad-orchestrator.js` script handles the packaging of assets, the core behavior, agent definitions, and personality of the Orchestrator and its managed agents are defined in a separate YAML configuration file, typically `BETA-V3/samples/orchestrator-agent-cfg.gemini.yaml`. This file is **central** to the Orchestrator's power and flexibility.

**Key Features and Configurability:**

- **Agent Definitions**: This YAML file lists all the specialized agents the Orchestrator can embody. Each agent is defined with attributes such as:
  - `title`: A user-friendly title (e.g., "Product Manager").
  - `name`: A specific name for the agent (e.g., "John").
  - `classification_label`: A label used for internal identification (e.g., "PM").
  - `description`: A brief of the agent's purpose.
  - `persona_core`: A reference to a specific section within a bundled asset file (e.g., `personas#pm` refers to the `pm` section in `personas.txt`). This defines the agent's core personality, instructions, and operational guidelines.
  - `checklists`, `templates`, `data_sources`: Lists of references to specific sections in bundled asset files (e.g., `checklists#pm-checklist`) that provide the agent with its necessary knowledge base and tools.
  - `operating_modes`: Defines different modes or phases the agent can operate in (e.g., "Outcome Focused PRD Generation", "Deep Research").
  - `interaction_modes`: Specifies how the agent interacts (e.g., "Interactive", "YOLO" - which implies attempting to complete tasks autonomously).
  - `available_tasks`: Links to specific task definitions (e.g., `tasks#story-draft-task`), imbuing the agent with the ability to perform predefined complex operations.
- **Custom Instructions**: Each agent definition can include `custom_instructions`. This is a powerful feature allowing you to inject specific personality traits, quirks, or overriding behaviors directly into an agent. For example, an agent might be configured with `custom_instructions: "You are a bit of a know-it-all, and like to verbalize and emote as if you were a physical person."`
  - As detailed in the `BETA-V3/bmad-agent/orchestrator-agent.md` (the main prompt for the orchestrator), these `custom_instructions` are layered on top of the agent's `persona_core` and take precedence if there are conflicts. This provides a fine-grained control over individual agent personalities without altering the base persona files.

**How it Works (Conceptual Flow from `orchestrator-agent.md`):**

1.  The Orchestrator (initially BMad) loads and parses `orchestrator-agent-cfg.gemini.yaml`.
2.  When a user request matches an agent's `title`, `name`, `description`, or `classification_label`, the Orchestrator identifies the target agent.
3.  It then loads the agent's `persona_core` and any associated `templates`, `checklists`, `data_sources`, and `tasks` by:
    - Identifying the correct bundled `.txt` file (e.g., `personas.txt` for `personas#pm`).
    - Extracting the specific content block (e.g., the `pm` section from `personas.txt`).
4.  The `custom_instructions` from the YAML are applied, potentially modifying the agent's behavior.
5.  The Orchestrator then _becomes_ that agent, adopting its complete persona, knowledge, and operational parameters defined in the YAML and the loaded asset sections.

This system makes the Agent Orchestrator highly adaptable. You can easily define new agents, modify existing ones, tweak personalities with `custom_instructions` (in `orchestrator-agent-cfg.gemini.yaml`), or change their knowledge base, main prompt, and asset paths (in `build-agent-cfg.js` and the corresponding asset files), then re-running the build script if asset content was changed.

## IDE Agent Setup

The IDE Agents in V3 have all been optimized to be under 6k total size to be compatible with Windsurf, and generally more optimized for IDE usage! Ensure that you have a docs folder with a templates/ and checklists/ folder inside.

### Cursor

Cursor will only (at this time) support up to 5 custom agents - so for cursor its highly recommended to use the web version for the agents that can be used there, and save agent custom mode set up in the IDE to the ones that make sense there - at a minimum - dev agent, sm agent. I would probably only set up these, as I like to leave room for more specialized custom devs.

Tasks are introduced in V3, and Workflows are also coming - which will soon allow a more generic agile pro agent to handle most of the prework that multiple agents do now.

#### Setting Up Custom Modes in Cursor

1. **Access Agent Configuration**:

   - Navigate to Cursor Settings > Features > Chat & Composer
   - Look for the "Rules for AI" section to set basic guidelines for all agents

2. **Creating Custom Agents**:

   - Custom Agents can be created and configured with specific tools, models, and custom prompts
   - Cursor allows creating custom agents through a GUI interface
   - See [Cursor Custom Modes doc](https://docs.cursor.com/chat/custom-modes#custom-modes)

3. **Configuring BMAD Method Agents**:

   - Define specific roles for each agent in your workflow (Analyst, PM, Architect, PO/SM, etc.)
   - Specify what tools each agent can use (both Cursor-native and MCP)
   - Set custom prompts that define how each agent should operate
   - Control which model each agent uses based on their role
   - Configure what they can and cannot YOLO

### Windsurf

All V3 Agents have been optimized to be under 6K character limit, great for Windsurf usage now!

#### Setting Up Custom Modes in Windsurf

1. **Access Agent Configuration**:

   - Click on "Windsurf - Settings" button on the bottom right
   - Access Advanced Settings via the button in the settings panel or from the top right profile dropdown

2. **Configuring Custom Rules**:

   - Define custom AI rules for Cascade (Windsurf's agentic chatbot)
   - Specify that agents should respond in certain ways, use particular frameworks, or follow specific APIs

3. **Using Flows**:

   - Flows combine Agents and Copilots for a comprehensive workflow
   - The Windsurf Editor is designed for AI agents that can tackle complex tasks independently
   - Use Model Context Protocol (MCP) to extend agent capabilities

4. **BMAD Method Implementation**:
   - Create custom agents for each role in the BMAD workflow
   - Configure each agent with appropriate permissions and capabilities
   - Utilize Windsurf's agentic features to maintain workflow continuity

### RooCode

#### Setting Up Custom Agents in RooCode

1. **Custom Modes Configuration**:

   - Create tailored AI behaviors through configuration files
   - Each custom mode can have specific prompts, file restrictions, and auto-approval settings

2. **Creating BMAD Method Agents**:

   - Create distinct modes for each BMAD role (Analyst, PM, Architect, PO/SM, Dev, Documentation, etc...)
   - Customize each mode with tailored prompts specific to their role
   - Configure file restrictions appropriate to each role (e.g., Architect and PM modes may edit markdown files)
   - Set up direct mode switching so agents can request to switch to other modes when needed

3. **Model Configuration**:

   - Configure different models per mode (e.g., advanced model for architecture vs. cheaper model for daily coding tasks)
   - RooCode supports multiple API providers including OpenRouter, Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, and local models

4. **Usage Tracking**:
   - Monitor token and cost usage for each session
   - Optimize model selection based on the complexity of tasks

### Cline

#### Setting Up Custom Agents in Cline

1. **Custom Instructions**:

   - Access via Cline > Settings > Custom Instructions
   - Provide behavioral guidelines for your agents

2. **Custom Tools Integration**:

   - Cline can extend capabilities through the Model Context Protocol (MCP)
   - Ask Cline to "add a tool" and it will create a new MCP server tailored to your specific workflow
   - Custom tools are saved locally at ~/Documents/Cline/MCP, making them easy to share with your team

3. **BMAD Method Implementation**:

   - Create custom tools for each role in the BMAD workflow
   - Configure behavioral guidelines specific to each role
   - Utilize Cline's autonomous abilities to handle the entire workflow

4. **Model Selection**:
   - Configure Cline to use different models based on the role and task complexity

### GitHub Copilot

#### Custom Agent Configuration (Coming Soon)

GitHub Copilot is currently developing its Copilot Extensions system, which will allow for custom agent/mode creation:

1. **Copilot Extensions**:

   - Combines a GitHub App with a Copilot agent to create custom functionality
   - Allows developers to build and integrate custom features directly into Copilot Chat

2. **Building Custom Agents**:

   - Requires creating a GitHub App and integrating it with a Copilot agent
   - Custom agents can be deployed to a server reachable by HTTP request

3. **Custom Instructions**:
   - Currently supports basic custom instructions for guiding general behavior
   - Full agent customization support is under development

_Note: Full custom mode configuration in GitHub Copilot is still in development. Check GitHub's documentation for the latest updates._

## Tasks

The Tasks can be copied into your project docs/tasks folder, along with the checklists and templates. The tasks are meant to reduce the amount of 1 off IDE agents - you can just drop a task into chat with any agent and it will perform the 1 off task. There will be full workflow + task coming post V3 that will expand on this - but tasks and workflows are a powerful concept that will allow us to build in a lot of capabilities for our agents, without having to bloat their overall programming and context in the IDE - especially useful for tasks that are not used frequently - similar to seldom used ide rules files.
