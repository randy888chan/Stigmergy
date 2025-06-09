# Tool Utilization Task

## Purpose
Enable BMAD agents to effectively utilize all available tools during their work, maximizing productivity and output quality through intelligent tool selection and usage.

## Available Tools Overview

### File System Tools
- **Read**: Read file contents with line numbers
- **Write**: Create new files with content
- **Edit**: Make precise string replacements in existing files
- **MultiEdit**: Make multiple edits to a single file efficiently
- **LS**: List directory contents with filtering options
- **Glob**: Find files matching patterns
- **Grep**: Search file contents with regex

### Development Tools
- **Bash**: Execute shell commands with timeout control
- **NotebookRead**: Read Jupyter notebook contents
- **NotebookEdit**: Modify Jupyter notebook cells

### Information Tools
- **WebSearch**: Search the web for current information
- **WebFetch**: Fetch and analyze web content with AI
- **TodoRead**: Read current task list
- **TodoWrite**: Update task tracking

### Collaboration Tools
- **Task**: Launch specialized agents for complex searches or analyses

## Tool Selection Guidelines

### 1. Research and Analysis Phase

**For Market Research (Analyst)**:
```
Primary Tools:
- WebSearch: Current market trends, competitor analysis
- WebFetch: Detailed analysis of competitor websites/documentation
- Task: Complex multi-source research compilation

Example Workflow:
1. WebSearch for "latest trends in [domain] 2024"
2. WebFetch competitor sites for feature analysis
3. Task to compile comprehensive market report
```

**For Technical Research (Architect)**:
```
Primary Tools:
- WebSearch: Technology comparisons, best practices
- WebFetch: Official documentation analysis
- Grep/Glob: Analyze existing codebase patterns

Example Workflow:
1. Grep codebase for current technology usage
2. WebSearch for "[technology] vs [alternative] comparison"
3. WebFetch official docs for implementation details
```

### 2. Planning and Documentation Phase

**For PRD Creation (PM)**:
```
Primary Tools:
- Read: Review project brief and related documents
- Write/MultiEdit: Create and refine PRD
- TodoWrite: Track epic and story creation progress

Example Workflow:
1. Read project brief and stakeholder inputs
2. TodoWrite to plan PRD sections
3. Write PRD using template
4. MultiEdit for iterative refinements
```

**For Architecture Documentation (Architect)**:
```
Primary Tools:
- Glob: Find related architecture files
- Read: Analyze existing patterns
- Write/Edit: Create architecture documents
- Bash: Generate architecture diagrams (if tools available)

Example Workflow:
1. Glob "**/*architecture*.md" to find existing docs
2. Read relevant architecture patterns
3. Write comprehensive architecture document
4. Bash to run diagram generation tools
```

### 3. Implementation Phase

**For Story Creation (SM/PO)**:
```
Primary Tools:
- Read: Review PRD and architecture
- MultiEdit: Create multiple stories efficiently
- TodoWrite: Track story dependencies
- Edit: Refine story details

Example Workflow:
1. Read PRD to understand epics
2. TodoWrite to plan story breakdown
3. MultiEdit to create story batch
4. Edit individual stories for clarity
```

**For Code Implementation (Developer)**:
```
Primary Tools:
- Read: Understand requirements and existing code
- Grep: Find implementation patterns
- MultiEdit: Implement features across files
- Bash: Run tests and verify changes
- Git integration via Bash

Example Workflow:
1. Read story requirements and architecture
2. Grep for similar implementations
3. MultiEdit to implement feature
4. Bash to run tests
5. Bash for git operations
```

### 4. Quality Assurance Phase

**For Code Review (Architect/Dev)**:
```
Primary Tools:
- Glob: Find changed files
- Read: Review implementations
- Grep: Check for anti-patterns
- Edit: Suggest improvements
- Bash: Run linting and analysis tools

Example Workflow:
1. Bash "git diff --name-only" to find changes
2. Read changed files for review
3. Grep for common issues
4. Edit to fix problems
5. Bash to run quality checks
```

**For Testing (QA/Dev)**:
```
Primary Tools:
- Write: Create test files
- MultiEdit: Update test suites
- Bash: Execute test commands
- Read: Analyze test results

Example Workflow:
1. Read implementation to understand functionality
2. Write comprehensive test cases
3. Bash to run test suite
4. Read test output for failures
5. Edit to fix issues
```

### 5. Deployment Phase

**For Infrastructure (Platform Engineer)**:
```
Primary Tools:
- Write: Create configuration files
- Bash: Execute deployment commands
- WebFetch: Reference cloud provider docs
- TodoWrite: Track deployment checklist

Example Workflow:
1. Write infrastructure configuration
2. Bash to validate configurations
3. WebFetch for provider-specific details
4. Bash to deploy infrastructure
5. TodoWrite deployment status
```

## Advanced Tool Combinations

### Pattern 1: Comprehensive Analysis
```
Combine:
- Glob + Grep + Read for codebase analysis
- WebSearch + WebFetch for external research
- Task for complex multi-step investigations

Use When:
- Understanding large codebases
- Researching unfamiliar domains
- Analyzing competitor implementations
```

### Pattern 2: Bulk Operations
```
Combine:
- Glob + MultiEdit for widespread changes
- Grep + Edit for pattern-based updates
- Bash + TodoWrite for progress tracking

Use When:
- Refactoring across multiple files
- Updating API signatures
- Implementing cross-cutting concerns
```

### Pattern 3: Validation Workflows
```
Combine:
- Read + Bash for test execution
- Grep + WebSearch for error resolution
- Edit + Bash for iterative fixes

Use When:
- Debugging complex issues
- Validating implementations
- Ensuring quality standards
```

## Tool Usage Best Practices

### 1. Efficiency Guidelines
- **Batch Operations**: Use MultiEdit over multiple Edit calls
- **Parallel Execution**: Run multiple Bash commands in single tool call
- **Smart Search**: Use Glob/Grep before extensive Read operations
- **Caching**: Leverage WebFetch cache for repeated URL access

### 2. Error Handling
- **Validation**: Always validate file existence before Edit
- **Backups**: Use git (via Bash) before major changes
- **Timeouts**: Set appropriate timeouts for long-running Bash commands
- **Fallbacks**: Have alternative approaches for tool failures

### 3. Context Management
- **TodoWrite**: Track progress for complex multi-step tasks
- **Read Selectively**: Use offset/limit for large files
- **State Tracking**: Maintain context between tool operations
- **Documentation**: Comment on why specific tools were chosen

### 4. Security Considerations
- **Input Validation**: Sanitize inputs for Bash commands
- **Path Safety**: Use absolute paths for file operations
- **Sensitive Data**: Never log credentials or secrets
- **Web Safety**: Validate URLs before WebFetch operations

## Integration with BMAD Workflow

### 1. Analyst Phase
- Heavy use of WebSearch and WebFetch for research
- Task for complex analysis delegations
- Write for comprehensive briefs

### 2. PM Phase
- Read for understanding context
- Write/MultiEdit for PRD creation
- TodoWrite for epic/story tracking

### 3. Architecture Phase
- Grep/Glob for codebase analysis
- Write for documentation
- WebFetch for technology research

### 4. Implementation Phase
- Read for requirements understanding
- MultiEdit for code implementation
- Bash for testing and validation

### 5. Validation Phase
- Grep for quality checks
- Bash for automated testing
- Edit for issue resolution

## Persona-Specific Tool Preferences

### Analyst
Primary: WebSearch, WebFetch, Task, Write
Secondary: Read, TodoWrite

### PM
Primary: Read, Write, MultiEdit, TodoWrite
Secondary: WebSearch, Edit

### Architect
Primary: Grep, Glob, Read, Write
Secondary: WebFetch, Bash, MultiEdit

### Design Architect
Primary: Read, Write, WebFetch
Secondary: MultiEdit, Glob

### PO
Primary: Read, MultiEdit, TodoWrite
Secondary: Edit, Write

### SM
Primary: Read, MultiEdit, TodoWrite
Secondary: Write, Edit

### Developer
Primary: Read, MultiEdit, Bash, Grep
Secondary: Write, Edit, Glob

### Platform Engineer
Primary: Bash, Write, Read
Secondary: WebFetch, MultiEdit

## Success Metrics

Track tool usage effectiveness:
- Time saved through appropriate tool selection
- Error reduction from validation tools
- Quality improvement from comprehensive analysis
- Productivity gains from automation

This comprehensive tool utilization framework ensures all BMAD agents can leverage the full power of available tools to maximize their effectiveness and output quality.