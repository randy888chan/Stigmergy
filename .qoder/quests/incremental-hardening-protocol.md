# Incremental Hardening Protocol Design Document

## Overview

The Incremental Hardening Protocol is a systematic approach to refactor the Stigmergy codebase to a production-ready state using a safe, incremental, and professionally disciplined workflow. This protocol replaces the previous "all-at-once" approach which has proven to be unstable and risky.

The protocol consists of four distinct quests that must be completed sequentially, with each quest building upon the stability and security improvements of the previous one.

## Architecture

The protocol follows a four-phase incremental approach:

1. **The Stabilizer**: Isolate and stabilize the test framework to prevent accidental deletion of core assets
2. **The Architect**: Harden the core architecture by transitioning to a standalone service model
3. **The Sentinel**: Enhance shell security by replacing insecure sandboxing with secure execution
4. **The Scribe**: Update documentation to reflect the new secure architecture

Each phase is implemented in a separate Git branch and must pass all tests before merging to main.

## Quest 1: The Stabilizer (Fix the Test Framework)

### Objective
Create a 100% safe and reliable test environment that operates in isolated temporary directories to prevent accidental deletion or modification of the core `.stigmergy-core` directory.

### Implementation Plan

#### Tests Setup (`tests/setup.js`)
- Create a unique temporary directory for each Jest worker: `.stigmergy-core-test-temp-${process.env.JEST_WORKER_ID}`
- Copy contents from `tests/fixtures/test-core/.stigmergy-core` to the temporary directory
- Set global test configuration (`global.StigmergyConfig`) to point exclusively to this temporary path
- Implement multiple safety checks to ensure temporary directory isolation

#### Tests Teardown (`tests/teardown.js`)
- Implement cleanup function that only deletes temporary directories
- Add safety check to ensure path being deleted contains `.stigmergy-core-test-temp`
- Prevent deletion of the real `.stigmergy-core` directory through path validation

### Safety Measures
- Multiple validation checks to ensure temporary directory isolation
- Worker ID-based directory naming to prevent conflicts
- Path validation to prevent accidental core deletion

## Quest 2: The Architect (Harden the Core Architecture)

### Objective
Transition to a standalone service model where `.stigmergy-core` is a protected, read-only asset bundled with the NPM package.

### Implementation Plan

#### NPM Ignore Configuration (`.npmignore`)
- Remove the exclusion line for `.stigmergy-core/` to include it in the published package
- Ensure the core directory is bundled as a read-only asset

#### CLI Initialization (`cli/commands/init.js`)
- Refactor the `init` command to no longer copy the `.stigmergy-core` directory
- Create only the local `.stigmergy/` configuration folder with subdirectories (`trajectories`, `state`, etc.)
- Generate the `.env` file during initialization

#### Agent Loading (`engine/server.js`)
- Modify the `getAgent(agentId)` function to implement prioritized loading strategy:
  1. Check for local override in `./.stigmergy-core/agents/`
  2. Fall back to globally installed path (relative to `engine/server.js`)
- Ensure backward compatibility with existing projects

#### Agent Validation (`cli/commands/validate.js`)
- Update the `validateAgents` function to work without requiring a local `.stigmergy-core`
- Enable validation of agents from the globally installed package location

### Backward Compatibility
- Existing projects with local `.stigmergy-core` continue to work
- New projects use the global core with local override capability

## Quest 3: The Sentinel (Harden Shell Security)

### Objective
Replace the insecure `vm` sandbox with a secure, graceful implementation using built-in Node.js modules.

### Implementation Plan

#### Shell Tool (`tools/shell.js`)
- Replace `vm` module logic entirely with `child_process.exec` using `promisify`
- Implement proper error handling with `try...catch` blocks
- Return formatted error strings (e.g., `EXECUTION FAILED: ...`) instead of throwing unhandled promise rejections
- Maintain existing security checks for permitted commands

#### Test Updates (`tests/unit/tools/shell.test.js`)
- Rewrite tests to properly validate the new implementation
- Update failing command test to check for successful return of "EXECUTION FAILED" strings
- Ensure all security validation tests continue to pass

### Security Enhancements
- Eliminate potential vulnerabilities in `vm` sandbox implementation
- Graceful error handling without unhandled promise rejections
- Maintain existing command permission validation

## Quest 4: The Scribe (Finalize Documentation)

### Objective
Update all user-facing documentation to reflect the new, safer, and more professional workflow.

### Implementation Plan

#### README Updates
- Update installation instructions to emphasize `npm install -g` and `stigmergy init` workflow
- Document the new standalone service architecture
- Add "Security-First Architecture" section explaining the new protections
- Remove references to the old installation process

#### Documentation Updates
- Update all relevant documentation files to reflect the new architecture
- Ensure consistency across all user-facing documentation

### Documentation Structure
- Clear explanation of the standalone service model
- Updated installation and setup instructions
- Security considerations and best practices
- Migration path for existing projects

## Business Logic Layer

### Test Isolation Protocol
```
Isolation Level: Per-Worker
Temporary Directory: .stigmergy-core-test-temp-${JEST_WORKER_ID}
Source Fixture: tests/fixtures/test-core/.stigmergy-core
Safety Validation: Path must contain safety identifier
Cleanup Policy: Delete only verified temporary directories
```

### Agent Loading Hierarchy
```
Priority 1: Local Project Overrides (.stigmergy-core/agents/)
Priority 2: Global Installation (relative to engine/server.js)
Fallback: Error if neither location contains agent
```

### Shell Execution Security
```
Input Validation: Regex pattern matching against permitted commands
Execution Method: child_process.exec with promisify
Error Handling: Graceful return of formatted error strings
Timeout: 5-second execution limit
```

## Data Models & ORM Mapping

### Configuration Schema
```javascript
{
  core_path: string,          // Path to .stigmergy-core directory
  worker_id: string,          // Jest worker identifier
  temp_directory: string      // Temporary test directory path
}
```

### Agent Definition Schema
```yaml
agent:
  id: string                  // Agent identifier
  name: string                // Human-readable name
  model_tier: enum            // Model tier configuration
  persona:
    role: string              // Agent role definition
    style: string             // Communication style
    identity: string          // Agent identity
  core_protocols: array       // Core behavioral protocols
  engine_tools: array         // Available engine tools
```

## Middleware & Interceptors

### Security Interceptors
- Command permission validation before shell execution
- Path validation before file system operations
- Agent loading validation with fallback mechanisms

### Error Interceptors
- Graceful error handling for shell command failures
- Test environment cleanup with safety validation
- Agent loading fallback with detailed error reporting

## Testing

Each quest must pass the complete test suite before proceeding:

1. **Unit Tests**: Validate individual component functionality
2. **Integration Tests**: Ensure components work together correctly
3. **End-to-End Tests**: Verify complete system behavior
4. **Security Tests**: Confirm protection against unauthorized access