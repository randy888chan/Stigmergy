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
import AgentPerformance from "./agent_performance.js";
import swarmMemory from "./swarm_memory.js";
import coreBackup from "../services/core_backup.js";
import { StateGraph, END, interrupt, MemorySaver } from "@langchain/langgraph";
import { add } from "@langchain/langgraph/prebuilt";
import { researchGraph } from "./research_graph.js";

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
  parallel_tasks: null,
  agent_history: add,
  recursion_level: (a, b) => (a ?? 0) + (b ?? 0),
};

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.healthMonitor = new LightweightHealthMonitor();
    this.graph = this.setupGraph();
    this.setupRoutes();
  }

  setupGraph() {
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
      const nextTask = plan.shift();
      return { parallel_tasks: [nextTask], execution_plan: plan };
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

    const synthesisNode = async (state) => ({
      last_result: state.last_result,
      agent_history: ["synthesis"],
    });

    const conductResearchNode = async (state) => {
      const researchResult = await researchGraph.invoke({
        topic: state.prompt,
        learnings: [],
        search_queries: [],
        recursion_level: 0,
      });
      return { last_result: researchResult.final_report, agent_history: ["conduct_research"] };
    };

    const waitForHumanInput = () => interrupt();

    const routerEdge = (state) => {
      if (state.recursion_level > 20) return END;
      if (state.requires_human_approval) return "waitForHumanInput";
      if (state.execution_plan && state.execution_plan.length > 0) return "plan_executor";
      return "dispatcher";
    };

    workflow.addNode("getState", getStateNode.bind(this));
    workflow.addNode("dispatcher", dispatcherNode.bind(this));
    workflow.addNode("plan_executor", planExecutorNode.bind(this));
    workflow.addNode("agent", this.agentExecutorGraph.map());
    workflow.addNode("synthesis", synthesisNode.bind(this));
    workflow.addNode("conduct_research", conductResearchNode.bind(this));
    workflow.addNode("waitForHumanInput", waitForHumanInput.bind(this));

    workflow.setEntryPoint("getState");
    workflow.addConditionalEdges("getState", (state) =>
      state.state?.end_run ? END : "dispatcher"
    );
    workflow.addConditionalEdges("dispatcher", routerEdge);
    workflow.addEdge("plan_executor", "agent");
    workflow.addEdge("agent", "synthesis");
    workflow.addEdge("synthesis", "getState");
    workflow.addEdge("waitForHumanInput", END);

    const checkpointer = new MemorySaver();
    return workflow.compile({ checkpointer, mapper: (state) => state.parallel_tasks });
  }

  setupRoutes() {
    /* Omitted for brevity - No changes needed */
  }
  async triggerAgent(agentId, prompt, taskId = null) {
    /* Omitted for brevity - No changes needed */
  }
  async monitorHealth() {
    /* Omitted for brevity - No changes needed */
  }
  async stop(reason) {
    /* Omitted for brevity - No changes needed */
  }

  async start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Engine Engaged ---\n"));
    const state = await stateManager.getState();
    const thread_id = state.thread_id || `thread-${Date.now()}`;
    const config = { configurable: { thread_id } };
    const initialState = { agent_history: [], recursion_level: 0 };
    const run = async () => {
      for await (const event of this.graph.stream(initialState, config)) {
        if (!this.isEngineRunning) break;
      }
      const graphState = await this.graph.getState(config);
      if (graphState.next.length > 0) {
        await stateManager.updateState({
          checkpoint: graphState.config,
          project_status: "PAUSED_AWAITING_INPUT",
        });
        this.isEngineRunning = false;
      } else {
        await stateManager.updateState({ checkpoint: null });
        if (this.isEngineRunning) this.isEngineRunning = false;
      }
    };
    run();
  }
}

export async function main() {
  /* Omitted for brevity - No changes needed */
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
