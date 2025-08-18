import guardianTool from "../tools/guardian_tool.js";

async function runMetisTest() {
  console.log("--- Running Metis Workflow Test ---");

  // Mock the engine
  const mockEngine = {
    triggerAgent: async (agent, prompt) => {
      console.log(`Mock engine triggered for agent: ${agent}`);
      console.log(`Prompt: ${prompt}`);
      return "Mock guardian response";
    },
  };

  const guardian = guardianTool(mockEngine);

  // Simulate @metis proposing a change
  const proposal = {
    file_path: ".stigmergy-core/agents/debugger.md",
    new_content: 'agent: id: "debugger"\n ... new content ...',
    reason: "Hypothesis: Debugger needs a protocol for database connections.",
  };

  const result = await guardian.propose_change(proposal);
  console.log(`Result from propose_change: ${result}`);

  if (result.includes("Mock guardian response")) {
    console.log("✅ Metis workflow test passed.");
    return true;
  } else {
    console.error("❌ Metis workflow test failed.");
    return false;
  }
}

runMetisTest();
