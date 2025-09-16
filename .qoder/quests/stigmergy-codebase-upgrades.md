# Stigmergy Codebase Upgrades Design Document

## 1. Overview

This document outlines the design for a series of critical fixes, enhancements, and strategic implementations on the Stigmergy codebase. The objective is to increase system robustness, improve agent quality, enhance observability, and prepare the system for more advanced autonomous capabilities.

The upgrades are inspired by concepts from the Trae Agent system, particularly trajectory recording and agent evaluation patterns.

## 2. Architecture

The proposed upgrades will be implemented across several layers of the Stigmergy system:

1. **Core Engine Layer**: Modifications to engine/server.js and engine/tool_executor.js for trajectory recording
2. **Services Layer**: New trajectory recording service and evaluator agent
3. **Agent Layer**: New evaluator agent and modifications to dispatcher agent
4. **Tool Layer**: Sandbox implementation for shell commands
5. **Dashboard Layer**: New cost monitoring component
6. **Infrastructure Layer**: Benchmark evaluation framework

## 3. Critical Fixes

### 3.1 ES Module Compatibility in Test Setup

**Problem**: Tests are failing with ReferenceError due to mixed CommonJS and ES Module syntax.

**Solution**: Convert all test files to use ES Module syntax consistently.

**Files to Modify**:
- tests/setup.js
- Any other test files that use require() syntax

**Implementation**:
- Replace CommonJS require() statements with ES Module import syntax
- Update all other CommonJS imports to ES Module syntax

## 4. Quality-of-Life Improvements

### 4.1 Automated Dashboard Build

**Problem**: Dashboard needs manual building after installation.

**Solution**: Add a postinstall script to automatically build the dashboard.

**Files to Modify**:
- package.json

**Implementation**:
- Add "postinstall": "npm run build:dashboard" to the scripts section

### 4.2 State Management Refactoring

**Problem**: State management logic is imported from multiple locations in engine/server.js.

**Solution**: Refactor to use a single entry point for state management.

**Files to Modify**:
- engine/server.js
- engine/state_manager.js

**Implementation**:
- Ensure engine/server.js only imports from engine/state_manager.js
- Make engine/state_manager.js correctly export all necessary functions

## 5. Strategic Implementations

### 5.1 Trajectory Recording Service

**Goal**: Implement formal trajectory recording inspired by Trae Agent's trajectory recorder to log every step of agent execution for improved debugging and analysis.

**Design**:
- Trajectory Recorder Service architecture with dedicated class
- Methods for recording different types of agent activities
- Integration points with engine and tool executor

**Files to Create**:
- services/trajectory_recorder.js

**Files to Modify**:
- engine/server.js (triggerAgent function)
- engine/tool_executor.js

**Implementation**:
1. Create trajectory recorder service with methods for starting recording, logging LLM interactions, tool calls, and finalizing recordings
2. Modify engine server to use this service and log LLM calls
3. Modify tool executor to log tool calls

### 5.2 Evaluator Agent Implementation

**Goal**: Implement an evaluator agent to improve code quality using an ensemble method inspired by Trae Agent's Selector Agent.

**Design**:
- Evaluator agent with senior software engineer persona
- Evaluation workflow for reviewing multiple solutions

**Files to Create**:
- .stigmergy-core/agents/evaluator.md

**Files to Modify**:
- .stigmergy-core/agents/dispatcher.md

**Implementation**:
1. Create evaluator agent definition with senior engineer persona
2. Modify dispatcher to generate three solutions and call evaluator agent
3. Implement evaluation prompt including original task, constitution, and solutions

[Content moved to avoid duplication]

### 5.3 Evaluation Benchmark Framework

**Goal**: Create a standardized benchmark to measure Stigmergy system performance inspired by SWE-bench.

**Design**:
- Benchmark framework structure with problem definitions and execution scripts
- Automated evaluation flow for measuring system performance

**Files to Create**:
- evaluation/benchmark.json
- evaluation/runners/benchmark_runner.js

**Files to Modify**:
- package.json

**Implementation**:
1. Create evaluation directory structure
2. Create benchmark.json with common software engineering problems
3. Define clear success criteria for each problem
4. Add test:benchmark script to package.json

## 6. Security Enhancements

### 6.1 Lightweight Sandbox for Tool Execution

**Goal**: Address security concerns of agents running shell commands by implementing a lightweight sandbox.

**Design**:
- Sandbox architecture replacing direct child process execution
- Secure execution context using Node.js vm module

**Files to Modify**:
- tools/shell.js

**Implementation**:
1. Replace child_process.exec with Node.js vm module
2. Create sandboxed context for command execution
3. Implement security checks and limitations

[Content moved to avoid duplication]

## 7. Observability Enhancements

### 7.1 Cost and Token Usage Dashboard Panel

**Goal**: Improve system observability by tracking operational costs and token usage.

**Design**:
- Cost monitoring dashboard component with visualization
- Data collection flow from LLM responses to dashboard display

**Files to Create**:
- dashboard/src/components/CostMonitor.js
- dashboard/src/components/CostMonitor.css

**Files to Modify**:
- dashboard/src/pages/Dashboard.js
- LLM adapter/client implementations

**Implementation**:
1. Modify LLM usage tracking to include cost information
2. Create CostMonitor React component
3. Integrate component into main dashboard

## 8. Implementation Plan

### Phase 1: Critical Fixes and Quality Improvements
1. Fix ES Module compatibility in test setup
2. Add automated dashboard build
3. Refactor state management imports

### Phase 2: Core Feature Implementation
1. Implement trajectory recording service
2. Create evaluator agent
3. Modify dispatcher to use ensemble method

### Phase 3: Advanced Features
1. Implement evaluation benchmark framework
2. Add lightweight sandbox for shell execution
3. Create cost monitoring dashboard panel

## 9. Testing Strategy

### Unit Tests
- Test trajectory recorder service functionality
- Verify evaluator agent prompt construction
- Validate sandbox security constraints
- Check cost monitoring data collection

### Integration Tests
- End-to-end trajectory recording
- Agent ensemble workflow
- Benchmark execution and verification
- Dashboard component integration

### Security Tests
- Verify sandbox prevents unauthorized access
- Test command injection protection
- Validate permission boundaries

## 10. Deployment Considerations

1. **Backward Compatibility**: All changes should maintain backward compatibility
2. **Configuration**: New features should be configurable via environment variables
3. **Performance**: Trajectory recording should not significantly impact system performance
4. **Security**: Sandbox implementation must be thoroughly tested
5. **Documentation**: All new features should be documented in README and docs
