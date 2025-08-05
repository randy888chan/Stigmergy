# Example Use Case: Refactoring a Legacy Codebase

This example illustrates how Stigmergy can be used to safely and efficiently refactor a large, aging codebase.

## The Goal

The initial instruction is focused on improving code quality and maintainability:

> "Refactor the legacy 'Monolith' Java application. Your primary goals are to improve code quality by breaking down large classes, increase test coverage, and identify performance bottlenecks. Do not add new features."

## The Process: A Methodical Approach

Refactoring requires a careful, analytical approach. Stigmergy would use a combination of its code intelligence and QA agents to tackle this.

### 1. **Phase 1: Analysis & Indexing**

- **Code Intelligence Service**: The first step is to index the entire codebase. The service parses every source file and builds a detailed graph representation of the code in Neo4j. This graph includes classes, methods, dependencies, and inheritance structures.
- **`@analyst`**: Once the code is indexed, the `@analyst` agent is dispatched to perform an initial assessment. It uses advanced code intelligence tools to identify problem areas:
  - It uses `code_intelligence.calculateCKMetrics` on various classes. It flags classes with high CBO (Coupling) or low LCOM (Cohesion) as candidates for refactoring.
  - It looks for "code smells" like long methods or large classes by querying the graph directly.
- The output of this phase is a "Refactoring Plan" that prioritizes the most problematic areas of the codebase.

### 2. **Phase 2: Test-Driven Refactoring**

The dispatcher follows a strict, safety-first protocol for each refactoring task.

- **`@qa` (Test Writer)**: Before any code is changed, the `@qa` agent is tasked with "Write integration tests for the `GodClass` module to ensure its current behavior is fully covered." This establishes a safety net. The agent reads the existing code to understand its functionality and writes a comprehensive suite of tests. It then runs the tests to ensure they all pass, confirming a stable baseline.

- **`@refactorer`**: With the tests in place, the `@refactorer` agent is dispatched to perform the actual refactoring. For example: "Refactor the `GodClass` by extracting the `processOrder` logic into a new `OrderProcessor` class."
  - The agent uses `code_intelligence.findUsages` to understand all the dependencies of the code it's about to change.
  - It performs the refactoring, creating new files (`OrderProcessor.java`) and modifying the original class.

- **`@qa` (Test Runner)**: After the `@refactorer` has finished, the `@qa` agent runs the exact same test suite again.
  - If all tests pass, it means the refactoring was successful and did not alter the external behavior of the module.
  - If any tests fail, the `@debugger` is immediately dispatched to fix the regression introduced by the refactoring.

### 3. **Phase 3: Iteration**

This "Test, Refactor, Test" cycle is repeated for each item in the Refactoring Plan. This methodical, test-driven approach minimizes the risk of introducing bugs, which is the primary challenge when working with legacy code.

## Conclusion

This use case highlights Stigmergy's strengths in tasks that require deep code understanding and a systematic, safety-conscious workflow. By leveraging the code intelligence graph and a dedicated team of refactoring and QA agents, Stigmergy can modernize a legacy application more quickly and with fewer errors than a manual process.
