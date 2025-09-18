# Stigmergy Production-Ready Refactor Design

## 1. Overview

This document outlines the design for refactoring the Stigmergy codebase to make it production-ready through three key phases:

1. **Hardening the Core**: Improve security and reliability by replacing the vm sandbox with isolated-vm and structuring inter-agent communication
2. **Enhancing the "Brain"**: Improve the quality of generated code by implementing executable benchmarks and expanding the reference library
3. **Polishing the Experience**: Verify and enhance the user-facing components, including the interactive CLI and the web dashboard

The refactor follows a systematic approach to elevate Stigmergy to production readiness while maintaining backward compatibility and ensuring system stability through comprehensive testing.

## 2. Phase 1: Hardening the Core (Security & Reliability)

### 2.1 Task 1.1: Implement isolated-vm Sandbox for Secure Shell Execution

#### Current Implementation
The current implementation in `tools/shell.js` uses Node.js's built-in `vm` module for sandboxing shell command execution. This approach has security limitations as the vm module doesn't provide true isolation.

#### Proposed Implementation
Replace the `vm` module with the `isolated-vm` library to create a true V8 isolate sandbox for executing shell commands.

**Changes Required:**
1. Add `isolated-vm` dependency to `package.json`
2. Modify `tools/shell.js` to use `isolated-vm` instead of `vm`
3. Implement proper memory limits and timeout handling
4. Ensure proper resource cleanup with `isolate.dispose()`

**Security Improvements:**
- True memory isolation between host and executed code
- Configurable memory limits to prevent resource exhaustion
- Proper disposal of isolate resources to prevent memory leaks
- Limited API exposure to executed code

#### Implementation Details
```javascript
// In tools/shell.js
import ivm from 'isolated-vm';

export async function execute({ command, agentConfig }) {
  // ... validation logic ...
  
  const isolate = new ivm.Isolate({ memoryLimit: 16 });
  try {
    const context = await isolate.createContext();
    const jail = context.global;
    
    // Create a log capture mechanism
    const logMessages = [];
    await jail.set('console', new ivm.Reference((...args) => {
      logMessages.push(args.join(' '));
    }));
    
    // Execute command with timeout
    const result = await context.eval(command, { timeout: 5000 });
    const copiedResult = await result.copy();
    
    return `OUTPUT:
${logMessages.join('
')}

RESULT:
${JSON.stringify(copiedResult, null, 2)}`;
  } finally {
    isolate.dispose();
  }
}
```

#### Verification Requirements
- The vm module is no longer used in tools/shell.js
- All shell commands are executed within a properly disposed ivm.Isolate
- Memory limits are properly enforced
- Timeout handling prevents indefinite execution

### 2.2 Task 1.2: Structure Inter-Agent Communication Protocol

#### Current Implementation
Agents communicate using natural language with string-based parsing (e.g., checking for "PASS" string). This approach is brittle and error-prone.

#### Proposed Implementation
Transition to a robust, structured JSON-based communication protocol between agents.

**Standard JSON Schema:**
```json
{
  "status": "success" | "failure" | "in_progress" | "request_clarification",
  "type": "task_completion" | "information_report" | "error_report",
  "payload": {
    // Content specific to the message type
  }
}
```

**Changes Required:**
1. Update agent protocols in `.stigmergy-core/agents/` to specify JSON response format
2. Modify `engine/server.js` to parse JSON responses from agents
3. Add error handling for malformed JSON responses
4. Update agent core protocols to mandate JSON format

#### Implementation Details
```
// In engine/server.js
async function triggerAgent(agent, userPrompt, context = {}) {
  // ... existing logic ...
  
  try {
    const parsedResponse = JSON.parse(textResponse);
    // Handle structured response
    return { toolCall: parsedResponse };
  } catch (parseError) {
    // Handle malformed responses gracefully
    console.warn('Agent returned invalid JSON, using fallback');
    // ... fallback logic ...
  }
}
```

#### Verification Requirements
- The system no longer relies on string-matching for agent communication
- The triggerAgent function is responsible for parsing JSON responses
- Error handling gracefully manages malformed JSON responses
- All core agents (@qa, @dev, @dispatcher, etc.) are updated to use JSON format

## 3. Phase 2: Enhancing the "Brain" (Intelligence & Quality)

### 3.1 Task 2.1: Implement Executable Benchmarks

#### Current Implementation
The benchmark runner in `evaluation/runners/benchmark_runner.js` performs simple file checks without executing the generated code.

#### Proposed Implementation
Upgrade the benchmark runner to execute generated code and programmatically verify correctness.

**Changes Required:**
1. Add `validation_script` property to problems in `evaluation/benchmark.json`
2. Create validation scripts for each problem in `evaluation/validators/`
3. Modify `validateSolution` function to execute validation scripts
4. Determine success/failure based on script exit codes

#### Implementation Details
```javascript
// In evaluation/runners/benchmark_runner.js
async function validateSolution(problem, solutionDir) {
  if (problem.validation_script) {
    const validationScriptPath = path.join(__dirname, '../validators', problem.validation_script);
    const solutionScriptPath = path.join(solutionDir, problem.validation_script);
    
    // Copy validation script to solution directory
    await fs.copy(validationScriptPath, solutionScriptPath);
    
    // Execute validation script
    const { stdout, stderr } = await execPromise(`node ${solutionScriptPath}`, {
      cwd: solutionDir,
      timeout: 30000
    });
    
    // Success determined by exit code (0 = success)
    return { success: true, output: stdout };
  }
  // ... fallback to existing validation ...
}
```

### 3.2 Task 2.2: Curate and Expand the Reference Library

#### Current Implementation
The `DEFAULT_REPOS` in `services/code_reference_indexer.js` contains a limited set of repositories.

#### Proposed Implementation
Replace with a more comprehensive, curated list of high-quality JavaScript/Node.js repositories.

**New Repository List:**
1. expressjs/express
2. lodash/lodash
3. moment/moment.js
4. chartjs/Chart.js
5. axios/axios
6. prettier/prettier
7. reactjs/react
8. vuejs/vue
9. nodejs/node
10. microsoft/typescript

## 4. Phase 3: Polishing the Experience (Usability & Adoption)

### 4.1 Task 3.1: Verification of Completed Work - Enhance Interactive init

#### Current Implementation
The CLI already has an interactive init command that prompts for API keys.

#### Verification Requirements
1. Confirm prompts for project name and desired features
2. Confirm API key configuration workflow
3. Verify correct writing of keys to `.stigmergy/.env` file
4. Ensure user-friendly error handling

### 4.2 Task 3.2: Implement Interactive Dashboard Features

#### Current Implementation
Dashboard displays system state but lacks interactive capabilities for agent communication.

#### Proposed Implementation
Implement two-way communication for handling agent clarification requests.

**Changes Required:**
1. Add message type handling for clarification requests in engine WebSocket communication
2. Implement UI component in dashboard to display clarification requests
3. Add user input mechanism for responses
4. Implement WebSocket message sending for user responses

#### Implementation Details
```javascript
// In dashboard components
const ClarificationHandler = ({ ws }) => {
  const [clarification, setClarification] = useState(null);
  
  useEffect(() => {
    if (ws.data?.type === 'clarification_request') {
      setClarification(ws.data.payload);
    }
  }, [ws.data]);
  
  const handleSubmit = (response) => {
    ws.sendMessage({
      type: 'clarification_response',
      payload: { response }
    });
    setClarification(null);
  };
  
  if (!clarification) return null;
  
  return (
    <div className="clarification-modal">
      <h3>Agent Needs Clarification</h3>
      <p>{clarification.question}</p>
      <input type="text" onKeyPress={(e) => {
        if (e.key === 'Enter') handleSubmit(e.target.value);
      }} />
    </div>
  );
};
```

## 5. Testing Strategy

### 5.1 Integration Testing
After each phase, run the full integration test suite:
```bash
npm run test:integration
```

### 5.2 Security Testing
- Validate isolated-vm sandbox prevents access to host resources
- Test memory limits prevent resource exhaustion
- Verify proper disposal of isolate resources

### 5.3 Communication Protocol Testing
- Test JSON parsing of agent responses
- Validate error handling for malformed responses
- Ensure backward compatibility with existing agents

### 5.4 Benchmark Testing
- Execute all benchmark problems with new validation scripts
- Verify success/failure determination based on exit codes
- Test timeout handling for long-running validations

## 6. Rollout Plan

### Phase 1: Hardening the Core
1. Implement isolated-vm sandbox (Task 1.1)
2. Run integration tests
3. Structure inter-agent communication (Task 1.2)
4. Run integration tests

### Phase 2: Enhancing the "Brain"
1. Implement executable benchmarks (Task 2.1)
2. Run integration tests
3. Expand reference library (Task 2.2)
4. Run integration tests

### Phase 3: Polishing the Experience
1. Verify interactive CLI (Task 3.1)
2. Run integration tests
3. Implement dashboard interactivity (Task 3.2)
4. Run integration tests

## 7. Risk Mitigation

### Security Risks
- Thoroughly test isolated-vm implementation to ensure true isolation
- Implement strict memory limits and timeouts
- Add monitoring for resource usage

### Compatibility Risks
- Maintain backward compatibility with existing agent protocols during transition
- Provide fallback mechanisms for malformed JSON responses
- Test with existing benchmark problems

### Performance Risks
- Monitor performance impact of isolated-vm overhead
- Optimize validation script execution
- Implement proper error handling to prevent system hangs