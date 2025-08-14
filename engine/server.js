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
import { StateGraph, END, interrupt } from "@langchain/langgraph";
import { add } from "@langchain/langgraph/prebuilt";
import { researchGraph } from "./research_graph.js";
import { RunnablePick, RunnableLambda } from "@langchain/core/runnables";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

const agentState = {
  state: null,
  next_agent: null,
  prompt: null,
  last_result: null,
  requires_human_approval: null,
  execution_plan: null,
  agent_history: add,
  recursion_level: (a, b) => (a ?? 0) + (b ?? 0),
};

export class Engine {
  constructor(checkpointer) {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.healthMonitor = new LightweightHealthMonitor();
    this.graph = this.setupGraph(checkpointer);
    // this.setupRoutes();
  }

  setupGraph(checkpointer) {
    const workflow = new StateGraph({ channels: agentState });

    const getStateNode = async (state) => {
      const currentState = await stateManager.getState();
      const autonomous_states = [
        "GRAND_BLUEPRINT_PHASE",
        "EXECUTION_IN_PROGRESS",
        "EXECUTION_FAILED",
      ];
      if (!autonomous_states.includes(currentState.project_status)) {
        return { state: { end_run: true } };
      }
      return { state: currentState, agent_history: ["getState"], recursion_level: 1 };
    };

    const dispatcherNode = async (state) => {
      const currentState = state.state;
      const prompt = `System state is updated. Generate a sequential 'execution_plan' as a JSON array of tasks (each with 'agent' and 'prompt'). If a high-impact or ambiguous decision is needed, also include 'requires_human_approval: true'. If no plan is needed, return an empty plan [].\n\nCURRENT STATE:\n${JSON.stringify(currentState, null, 2)}`;
      const result = await this.triggerAgent("dispatcher", prompt);
      let plan = [];
      let approval = false;
      try {
        const parsed = JSON.parse(result.replace(/```json\n?/, "").replace(/```/, ""));
        if (parsed.execution_plan && Array.isArray(parsed.execution_plan))
          plan = parsed.execution_plan;
        approval = parsed.requires_human_approval || false;
      } catch (e) {
        console.error(chalk.red("[Dispatcher] Failed to parse plan."), e);
      }
      return {
        last_result: result,
        execution_plan: plan,
        requires_human_approval: approval,
        agent_history: ["dispatcher"],
      };
    };

    const planExecutorNode = async (state) => {
      const plan = state.execution_plan;
      if (!plan || plan.length === 0) {
        return { execution_plan: [] }; // Return empty to signal completion
      }
      const nextTask = plan.shift();
      // This node's output IS the input for the mapped node. It MUST be an array.
      return {
        execution_plan: plan, // Update the plan in the state
        last_result: [nextTask], // Provide the single task as an array for the map
      };
    };

    const agentExecutorGraph = new StateGraph({
      channels: { agent: null, prompt: null, result: null },
    });
    agentExecutorGraph.addNode("run_agent", async (state) => ({
      result: await this.triggerAgent(state.agent, state.prompt),
    }));
    agentExecutorGraph.setEntryPoint("run_agent");
    agentExecutorGraph.addEdge("run_agent", END);
    this.agentExecutorGraph = agentExecutorGraph.compile();

    const waitForHumanInput = () => interrupt();

    const routerEdge = (state) => {
      if (state.recursion_level > 20) {
        console.error("Recursion limit reached");
        return END;
      }
      if (state.requires_human_approval) {
        return "waitForHumanInput";
      }
      if (state.execution_plan && state.execution_plan.length > 0) {
        return "plan_executor";
      }
      const lastAgent = state.agent_history[state.agent_history.length - 1];
      if (
        lastAgent === "dispatcher" &&
        (!state.execution_plan || state.execution_plan.length === 0)
      ) {
        return END;
      }
      return "dispatcher";
    };

    workflow.addNode("getState", getStateNode.bind(this));
    workflow.addNode("dispatcher", dispatcherNode.bind(this));
    workflow.addNode("plan_executor", planExecutorNode.bind(this));
    const agentRunner = new RunnablePick("last_result").pipe(this.agentExecutorGraph.map());
    const agentNode = new RunnableLambda({
      func: async (input) => {
        const result = await agentRunner.invoke(input);
        return { last_result: result };
      },
    });
    workflow.addNode("agent", agentNode);
    workflow.addNode("waitForHumanInput", waitForHumanInput.bind(this));

    workflow.setEntryPoint("getState");
    workflow.addConditionalEdges("getState", (state) =>
      state.state?.end_run ? END : "dispatcher"
    );
    workflow.addConditionalEdges("dispatcher", routerEdge);
    workflow.addEdge("plan_executor", "agent");
    workflow.addEdge("agent", "getState"); // Loop back after execution to continue plan

    return workflow.compile({ checkpointer });
  }

  // Omitted for brevity: setupRoutes, triggerAgent, monitorHealth, stop, main
}
