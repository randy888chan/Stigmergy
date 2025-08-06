#!/usr/bin/env node
import { LightweightHealthMonitor } from "../src/monitoring/lightweightHealthMonitor.js";
import chalk from "chalk";

async function checkHealth() {
  const healthMonitor = new LightweightHealthMonitor();
  const summary = await healthMonitor.getHealthSummary();

  console.log(chalk.blue("🩺 Stigmergy Agent Health Summary:"));
  console.log(
    chalk.green(`\n  ${summary.healthyAgents} / ${summary.totalAgents} agents are healthy.\n`)
  );

  if (summary.totalAgents > 0) {
    console.log(chalk.bold("  Agent Details:"));
    for (const agentId in summary.agents) {
      const agent = summary.agents[agentId];
      const status =
        agent.status === "healthy" ? chalk.green("● Healthy") : chalk.red("○ Unhealthy");
      const lastSeen = new Date(agent.lastSeen).toLocaleString();
      console.log(`    - ${chalk.yellow(agentId)}: ${status} (Last seen: ${lastSeen})`);
    }
  }
}

checkHealth().catch(console.error);
