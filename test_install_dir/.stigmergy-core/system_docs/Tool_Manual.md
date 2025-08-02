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
- **`code_intelligence.getModuleDependencies`**: Lists all modules that a specific file imports.
- **`code_intelligence.calculateCKMetrics`**: Calculates code quality metrics (e.g., WMC, DIT, NOC, CBO) for a given class.

---

### **Namespace: `system`**

- **`system.updateStatus`**: Allows an agent to update the global project status, signaling a handoff.
- **`system.approveExecution`**: Used by the dispatcher to signal user consent and start the execution phase.

---

### **Namespace: `stigmergy`**

- **`stigmergy.createBlueprint`**: Used by the meta agent to generate a machine-readable improvement proposal for the system itself.
