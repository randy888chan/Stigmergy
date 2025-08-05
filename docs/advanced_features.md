# Advanced Features and Tools

This guide covers some of the more advanced tools available in Stigmergy that can significantly enhance the system's capabilities for complex tasks.

## 1. `research.deep_dive`

The `research.deep_dive` tool is a powerful utility for performing in-depth, multi-page web research on a given topic. It goes beyond a simple search by crawling multiple pages to synthesize a comprehensive answer.

**When to Use It:**

- When an agent needs to understand a new technology, library, or API.
- For market research or competitor analysis.
- To gather information on best practices for a specific programming problem.

**Example Usage:**
An agent like `@analyst` might be given the task "Research the best practices for building scalable APIs in Node.js".

The agent would then use the tool like this:

```json
{
  "tool": "research.deep_dive",
  "args": {
    "query": "best practices for scalable Node.js APIs"
  }
}
```

**How It Works:**
The tool uses the Firecrawl API to perform a smart search, visit relevant pages, and extract the most important information. The result is a detailed report that the agent can use to inform its planning and decision-making.

**Prerequisites:**
This tool requires a `FIRECRAWL_KEY` to be set in your `.env` file.

---

## 2. `code_intelligence.findUsages`

This tool allows an agent to find all the locations in the codebase where a specific function, class, or variable is used. It is essential for understanding the impact of a code change.

**When to Use It:**

- Before refactoring a function, to see where it's called.
- When debugging, to trace how a variable is being used.
- To understand the relationships between different parts of the codebase.

**Example Usage:**
An agent like `@refactorer` is tasked with "Refactor the `getUser` function to be more efficient."

Before making changes, the agent would use the tool to find all usages:

```json
{
  "tool": "code_intelligence.findUsages",
  "args": {
    "symbolName": "getUser"
  }
}
```

**How It Works:**
This tool leverages the Neo4j graph database. It queries the graph to find the node corresponding to the `symbolName` and then finds all other nodes that have an `IMPORTS` or `CALLS` relationship to it.

**Prerequisites:**
This tool requires a running Neo4j instance that has already indexed the project codebase.

---

## 3. `code_intelligence.calculateCKMetrics`

This tool calculates the Chidamber and Kemerer (CK) object-oriented design metrics for a given class. These metrics help quantify the complexity and quality of the code.

**When to Use It:**

- To programmatically assess the quality of a class.
- To identify classes that might be good candidates for refactoring.
- As part of a QA process to enforce coding standards.

**The Metrics:**

- **WMC (Weighted Methods per Class):** A measure of the complexity of a class.
- **DIT (Depth of Inheritance Tree):** How far down the inheritance tree a class is.
- **NOC (Number of Children):** How many subclasses a class has.
- **CBO (Coupling Between Object classes):** How many other classes a class is coupled to.
- **RFC (Response For a Class):** The number of methods that can be invoked in response to a message to the class.
- **LCOM (Lack of Cohesion in Methods):** Measures how related the methods in a class are to each other.

**Example Usage:**
An agent like `@qa` could be tasked with "Assess the complexity of the `UserSession` class."

The agent would use the tool:

```json
{
  "tool": "code_intelligence.calculateCKMetrics",
  "args": {
    "className": "UserSession"
  }
}
```

**How It Works:**
The tool queries the Neo4j graph to find the class and its methods, inheritance relationships, and dependencies, then calculates the metrics based on this data.

**Prerequisites:**
Requires a running Neo4j instance with the codebase indexed.
