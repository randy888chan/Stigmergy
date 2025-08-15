// engine/server.js
import express from "express";
import chalk from "chalk";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as stateManager from "./state_manager.js";
import { getCompletion } from "./llm_adapter.js";
import { createExecutor } from "./tool_executor.js";
import codeIntelligenceService from "../services/code_intelligence_service.js";
import dashboardRouter from "./dashboard.js";
import "dotenv/config.js";
import { fileURLToPath } from "url";
import path from "path";
import boxen from "boxen";
import { readFileSync } from "fs";
import config from "../stigmergy.config.js";
import { LightweightHealthMonitor } from "../src/monitoring/lightweightHealthMonitor.js";
import { StateGraph, END, interrupt } from "@langgraph/langgraph";
import { add } from "@langchain/langgraph/prebuilt";
import { createPlanningGraph } from "./planning_graph.js";
import { createExecutionGraph } from "./execution_graph.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

const supervisorState = {
  goal: { value: (x, y) => y, default: () => "" },
  user_feedback: { value: (x, y) => y, default: () => "" },
  architecture_plan: { value: (x, y) => y, default: () => null },
  tasks: { value: (x, y) => y, default: () => [] },
  last_result: { value: (x, y) => y, default: () => null },
};

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.healthMonitor = new LightweightHealthMonitor();
    this.graph = null;
    this.planningGraph = null;
    this.executionGraph = null;
  }

  initialize(checkpointer) {
    const boundTriggerAgent = this.triggerAgent.bind(this);
    this.planningGraph = createPlanningGraph(boundTriggerAgent);
    this.executionGraph = createExecutionGraph(boundTriggerAgent);
    this.graph = this.setupGraph(checkpointer);
  }

  setupGraph(checkpointer) {
    const workflow = new StateGraph({ channels: supervisorState });

    const planningTeamNode = async (state) => {
      console.log(chalk.blue("--- SUPERVISOR: INVOKING PLANNING TEAM ---"));
      const planningResult = await this.planningGraph.invoke({ goal: state.goal });
      const tasks = [{ task: "Implement feature A based on plan", code: "" }];
      return {
        architecture_plan: planningResult.architecture_plan,
        tasks: tasks,
      };
    };

    const executionTeamNode = async (state) => {
      console.log(chalk.blue("--- SUPERVISOR: INVOKING EXECUTION TEAM ---"));
      const executionResults = await this.executionGraph.batch(state.tasks);
      return { last_result: executionResults };
    };

    // --- THIS IS THE CORRECTED NODE DEFINITION ---
    // By making this an async function that accepts state, we ensure LangGraph
    // correctly handles the state update when resuming from the interruption.
    const humanApprovalNode = async (state) => {
      console.log(chalk.yellow("--- SUPERVISOR: AWAITING HUMAN APPROVAL ---"));
      return interrupt();
    };
    // ---------------------------------------------

    workflow.addNode("planning_team", planningTeamNode.bind(this));
    workflow.addNode("execution_team", executionTeamNode.bind(this));
    workflow.addNode("human_approval", humanApprovalNode.bind(this));

    workflow.setEntryPoint("planning_team");
    workflow.addEdge("planning_team", "human_approval");

    workflow.addConditionalEdges(
      "human_approval",
      (state) => {
        // This log will now correctly show the updated feedback.
        console.log(chalk.magenta(`--- SUPERVISOR ROUTER: User feedback is '${state.user_feedback}' ---`));
        if (state.user_feedback === "proceed") {
          return "execution_team";
        }
        return "__end__";
      },
      {
        execution_team: "execution_team",
        __end__: END,
      }
    );

    workflow.addEdge("execution_team", END);

    return workflow.compile({ checkpointer });
  }

  async triggerAgent(agentId, prompt) {
    console.log(`[Engine] Triggering agent ${agentId}`);
    return `Result from ${agentId}`;
  }
}
