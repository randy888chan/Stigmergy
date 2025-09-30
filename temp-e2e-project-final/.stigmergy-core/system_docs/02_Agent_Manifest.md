# This is the master list of all agents available to the Stigmergy system.
# The core engine uses this to discover and load agent definitions.
agents:
  # === Core Autonomous Workflow ===
  - system              # The main user interface
  - specifier           # Creates the plan.md
  - dispatcher          # Executes the plan.md
  - executor            # Implements code for a single task
  - qa                  # Verifies the code
  - debugger            # Fixes code that fails verification

  # === Self-Improvement Loop ===
  - metis               # Analyzes failures and proposes improvements
  - guardian            # Safely applies improvements to the core

  # === On-Call Documentation & Planning Specialists ===
  - analyst             # Performs deep research
  - business_planner    # Creates business plans
  - valuator            # Performs financial analysis and valuation
  - ux-expert           # Analyzes and generates UI/UX designs
  - design-architect    # Creates the technical architecture blueprint
  - whitepaper_writer   # Creates high-level documentation

  # === On-Call Code Maintenance Specialists ===
  - refactorer          # Improves existing code quality

  # === Specialized CLI Executors ===
  - gemini-executor
  - qwen-executor
