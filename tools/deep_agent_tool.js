// In tools/deep_agent_tool.js
import { createDeepAgentGraph } from "../engine/deep_agent_graph.js"; // We will create this next

/**
 * Spawns a team of agents to autonomously handle a complex goal.
 * @param {object} args
 * @param {string} args.goal - The high-level goal for the team.
 * @param {string[]} args.agents - A list of agent IDs for the team (e.g., ['@pm', '@dev', '@qa']).
 * @returns {Promise<string>} The final result from the agent team.
 */
export async function spawnTeam({ goal, agents }) {
  console.log(`🚀 Spawning a new agent team for goal: ${goal}`);

  const deepAgentGraph = createDeepAgentGraph(agents);

  const finalResult = await deepAgentGraph.invoke({ goal });

  return `Team finished with result: ${JSON.stringify(finalResult)}`;
}
