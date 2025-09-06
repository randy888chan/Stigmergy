# Stigmergy Agent Job Passing Issue - Root Cause and Fix

## Problem Description

The system agent was unable to pass jobs to other Stigmergy agents through the `stigmergy.task` tool, even after multiple attempts to fix the issue. This was a critical problem that prevented proper agent coordination within the Stigmergy system.

## Root Cause Analysis

Through systematic debugging and analysis, I identified the root cause of the issue:

1. **Incorrect Parameter Passing**: The `stigmergy.task` implementation in [tool_executor.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/tool_executor.js) was calling `engine.triggerAgent(subagent_type, description)` where `subagent_type` was a string (e.g., "dispatcher").

2. **Method Signature Mismatch**: However, the [triggerAgent](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js#L415-L496) method in [server.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js) expects its first parameter to be an agent object, not a string.

3. **Agent Object Required**: The [triggerAgent](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js#L415-L496) method needs to look up the agent's system prompt, model tier, and other configuration from the agent object, which can only be obtained by calling `engine.getAgent(agentId)`.

## The Fix

I modified the `stigmergy.task` implementation in [engine/tool_executor.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/tool_executor.js) to correctly handle the agent lookup:

**Before (incorrect):**
```javascript
task: async ({ subagent_type, description }) => {
  if (!subagent_type || !description) {
    throw new Error("The 'subagent_type' and 'description' are required for stigmergy.task");
  }
  return await engine.triggerAgent(subagent_type, description); // ❌ Passing string instead of agent object
}
```

**After (fixed):**
```javascript
task: async ({ subagent_type, description }) => {
  if (!subagent_type || !description) {
    throw new Error("The 'subagent_type' and 'description' are required for stigmergy.task");
  }
  // Get the agent object from the engine
  const agent = engine.getAgent(subagent_type); // ✅ Get agent object first
  return await engine.triggerAgent(agent, description); // ✅ Pass agent object
}
```

## Verification

The fix has been verified through multiple approaches:

1. **Code Inspection**: Confirmed the correct implementation is in place
2. **Functional Testing**: Verified that `stigmergy.task` can successfully trigger other agents
3. **Agent Permissions**: Confirmed system and dispatcher agents have correct permissions
4. **Integration Testing**: Verified the complete flow from system agent to other agents

## Impact

With this fix in place, the Stigmergy system can now properly:

1. **System Agent Functionality**: The system agent can delegate tasks to other agents using `stigmergy.task`
2. **Agent Coordination**: Proper job passing between all Stigmergy agents is restored
3. **MCP Integration**: The MCP integration works correctly with proper agent communication
4. **Workflow Execution**: The complete Stigmergy workflow can execute without agent communication issues

## Files Modified

- [engine/tool_executor.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/tool_executor.js) - Fixed the `stigmergy.task` implementation

This was a critical fix that resolves the long-standing issue with agent job passing in the Stigmergy system.