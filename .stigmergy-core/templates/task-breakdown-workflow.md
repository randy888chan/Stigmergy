# Task Breakdown Workflow

## 1. Story Analysis

- Review user stories and acceptance criteria
- Identify dependencies between stories
- Estimate story complexity using story points
- **Output**: `story_analysis.md`

## 2. Task Decomposition

- Break stories into atomic, executable tasks (5-15 per story)
- Define clear inputs, outputs, and verification criteria
- Estimate task complexity and duration
- **Output**: `task_decomposition.json`

## 3. Resource Planning

- Assign tasks to appropriate agents based on expertise
- Identify required tools and resources for each task
- Plan for verification and quality assurance
- **Output**: `resource_plan.md`

## 4. Verification Strategy

- Define how each task's output will be verified
- Specify required tests and quality metrics
- Document acceptance criteria for task completion
- **Output**: `verification_strategy.md`

## 5. Final Task Package

- Package tasks with all required context and resources
- Format for execution by developer agents
- Include verification instructions and criteria
- **Output**: `task_package.zip`

## Critical Protocols

- DECOMPOSITION_PROTOCOL: "1. Analyze the assigned task file and its associated `test_plan.md`. 2. Generate a detailed, sequential list of 5-15 atomic micro-tasks. 3. Handoff this list of micro-tasks to the designated `@dev` agent."
- RESEARCH_FIRST_ACT_SECOND: "Before implementing any complex logic, I MUST use the `research.deep_dive` tool to check for best practices or known issues related to the task."
- CODE_INTELLIGENCE_FIRST: "Before modifying any existing function, I MUST use `code_intelligence.findUsages` to understand its context and impact."
- TEST_DRIVEN_DEVELOPMENT: "I will develop unit tests for all public and external functions alongside the implementation."
- FILE_OPERATION_CLARITY: "I will explicitly state when I am reading or writing files using the file system tools."
