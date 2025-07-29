# Pheromind System Tool Manual

This document provides a natural language description of all tools available to the agent swarm.

---

### **Namespace: `file_system`**

- **`file_system.readFile`**: Reads the content of a file.
- **`file_system.writeFile`**: Writes content to a file.
- **`file_system.listFiles`**: Lists all files within a directory.

---

### **Namespace: `shell`**

- **`shell.execute`**: Runs a shell command. Usage is restricted by agent permissions.

---

### **Namespace: `research`**

- **`research.deep_dive`**: Performs an iterative, deep research step on a topic. It returns key learnings and proposes new queries for further investigation.

---

### **Namespace: `code_intelligence`**

- **`code_intelligence.findUsages`**: Finds all files and functions that use a specific code symbol.
- **`code_intelligence.getDefinition`**: Retrieves the definition and type of a code symbol from the graph.

---

### **Namespace: `system`**

- **`system.updateStatus`**: Allows an agent to update the global project status, signaling a handoff.
- **`system.approveExecution`**: Used by the dispatcher to signal user consent and start the execution phase.

---

### **Namespace: `stigmergy`**

- **`stigmergy.createBlueprint`**: Used by the meta agent to generate a machine-readable improvement proposal for the system itself.
### **Namespace: `shell`**

This tool executes shell commands. **Warning:** Usage is restricted by agent permissions in the manifest. The `git push` command is explicitly forbidden.

- **`shell.execute`**: Runs a command in the system's shell.
  - **Arguments:** `{ "command": "ls -la" }`
  - **Returns:** A string containing the `STDOUT` and `STDERR` from the command.

---

### **Namespace: `web`**

This tool performs quick, API-driven web searches using a configurable provider.

- **`web.search`**: Gets a list of search results for a query.
  - **Arguments:** `{ "query": "your search query" }`
  - **Returns:** A formatted string of the top search results.

---

### **Namespace: `scraper`**

This tool performs deep scraping of a single web page.

- **`scraper.scrapeUrl`**: Extracts the primary textual content from a single URL.
  - **Arguments:** `{ "url": "https://example.com" }`
  - **Returns:** A string containing the cleaned body text of the page.

---

### **Namespace: `code_graph`**

This tool interacts with the Neo4j database to understand the project's code structure.

- **`code_graph.findUsages`**: Finds all files and functions that use a specific symbol.
  - **Arguments:** `{ "symbolName": "updateUser" }`
  - **Returns:** An array of objects detailing where the symbol is used.

- **`code_graph.getDefinition`**: Retrieves the definition and type of a symbol.
  - **Arguments:** `{ "symbolName": "updateUser" }`
  - **Returns:** An object with the symbol's ID and its type.

- **`code_graph.getModuleDependencies`**: Lists all modules that a specific file imports.
  - **Arguments:** `{ "filePath": "src/services/user.js" }`
  - **Returns:** An array of imported module paths.
