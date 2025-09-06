# Stigmergy Repository Deep Analysis and Fix Plan

## Current Issues Identified

1. **MCP Server Connectivity Problems**:
   - The `stigmergy_chat` tool doesn't exist on the `stigmergy-chat` server
   - Tool execution failures for `list_code_definition_names` and `apply_diff`
   - Integration problems between Roo Code and Stigmergy

2. **Repository Instability**:
   - Despite passing tests, the repository continues to have issues at every step
   - Configuration or environment problems causing inconsistent behavior

3. **Port and Process Management**:
   - Conflicting Stigmergy processes running simultaneously
   - Port misconfiguration between main Stigmergy and project directories

4. **Model Generation Issues**:
   - Errors with `model.doGenerate is not a function` indicating problems with AI provider integration

## Root Cause Analysis

1. **ESM Compatibility Issues**:
   - Improper handling of `__dirname` and `__filename` in ES Modules
   - Path resolution problems in CLI tools and MCP servers

2. **Environment Configuration Problems**:
   - Missing or incomplete `.env` file configuration
   - Incorrect API key setup for AI providers
   - Port conflicts between different Stigmergy instances

3. **MCP Integration Issues**:
   - Misconfigured tool definitions in MCP servers
   - Communication problems between Roo Code and Stigmergy API

4. **Dependency and State Management**:
   - Neo4j connection failures forcing fallback to Memory Mode
   - Incomplete CodeRAG initialization

## Comprehensive Fix Plan

### Phase 1: Environment and Configuration Fixes

1. **Create proper .env file**:
   - Copy `.env.example` to `.env`
   - Configure required API keys (Google AI, OpenRouter)
   - Set up proper port configurations

2. **Fix ESM compatibility issues**:
   - Ensure all files properly define `__dirname` and `__filename` for ESM
   - Update path resolution in CLI commands and MCP servers

3. **Port management standardization**:
   - Implement consistent port allocation (3010 for main, 3011 for projects)
   - Add process checking to prevent conflicts

### Phase 2: MCP Server Integration Fixes

1. **Standardize MCP tool definitions**:
   - Ensure all required tools are properly exposed
   - Fix tool execution interfaces to match expected signatures
   - Add proper error handling and logging

2. **Improve Roo Code integration**:
   - Verify universal MCP server template works correctly
   - Fix communication paths between MCP servers and Stigmergy API
   - Add better error reporting for connection issues

### Phase 3: AI Provider and Model Fixes

1. **Fix model generation issues**:
   - Update AI SDK integration to use current API
   - Add proper fallback mechanisms for model failures
   - Implement retry logic for rate limiting and transient errors

2. **Enhance provider configuration**:
   - Add validation for API key configurations
   - Implement graceful degradation for missing providers
   - Add better error messages for configuration issues

### Phase 4: State Management and Database Fixes

1. **Neo4j connection improvements**:
   - Fix connection parameters and encryption settings
   - Add better fallback mechanisms to Memory Mode
   - Implement connection retry logic

2. **CodeRAG initialization fixes**:
   - Resolve `getAllFiles is not a function` error
   - Ensure proper indexing of codebase
   - Add progress reporting for indexing operations

### Phase 5: Testing and Validation

1. **Comprehensive integration testing**:
   - Test MCP tool execution from Roo Code
   - Verify cross-directory functionality
   - Validate error handling and recovery

2. **Performance and stability testing**:
   - Test concurrent operations
   - Verify resource cleanup
   - Check long-running stability

## Implementation Steps

### Step 1: Environment Configuration
- Create `.env` file with proper API keys
- Configure port settings (3010 for main, 3011 for projects)
- Set up logging and debugging options

### Step 2: ESM Compatibility Fixes
- Update all files to properly handle `__dirname` and `__filename`
- Fix path resolution in CLI commands
- Ensure MCP servers work with ESM

### Step 3: MCP Server Standardization
- Update tool definitions in both main and universal MCP servers
- Fix tool execution interfaces
- Add comprehensive error handling

### Step 4: AI Provider Integration
- Fix model generation issues
- Implement retry mechanisms
- Add provider validation

### Step 5: Database and State Management
- Fix Neo4j connection issues
- Resolve CodeRAG initialization problems
- Implement proper fallback mechanisms

### Step 6: Testing and Validation
- Test all MCP tools from Roo Code
- Verify cross-directory functionality
- Validate error handling and recovery

## Expected Outcomes

1. **Stable Repository**: No more issues at every step
2. **Reliable MCP Integration**: Proper tool execution from Roo Code
3. **Consistent AI Provider Functionality**: No more model generation errors
4. **Proper State Management**: Reliable Neo4j connection with graceful fallbacks
5. **Cross-Directory Compatibility**: Works seamlessly from any project directory

## Risk Mitigation

1. **Backup Configuration**: Keep copies of working configurations
2. **Incremental Testing**: Test each fix individually before moving to next
3. **Rollback Plan**: Document steps to revert changes if issues arise
4. **Monitoring**: Add logging to track success of fixes

## Timeline

1. **Phase 1** (Environment): 2 hours
2. **Phase 2** (MCP Integration): 3 hours
3. **Phase 3** (AI Providers): 2 hours
4. **Phase 4** (State Management): 2 hours
5. **Phase 5** (Testing): 2 hours

Total estimated time: 11 hours