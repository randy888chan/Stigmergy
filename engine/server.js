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
import { createPlanningGraph } from "./planning_graph.js";
import { createExecutionGraph } from "./execution_graph.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

const REVIEW_FREQUENCY = 5; // Configurable number for periodic review

const supervisorState = {
  goal: { value: (x, y) => y, default: () => "" },
  user_feedback: { value: (x, y) => y, default: () => "" },
  architecture_plan: { value: (x, y) => y, default: () => null },
  tasks: { value: (x, y) => y, default: () => [] },
  last_result: { value: (x, y) => y, default: () => null },
  context_package: { value: (x, y) => y, default: () => "" },
  // Add last_error to state for self-correction
  last_error: { value: (x, y) => y, default: () => null },
  decision: { value: (x, y) => y, default: () => null },
  tasks_completed: { value: (x, y) => (x ?? 0) + y, default: () => 0 },
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

    const contextPreparerNode = async (state) => {
      console.log(chalk.cyan("--- SUPERVISOR: INVOKING CONTEXT PREPARER ---"));
      const context_package = await this.triggerAgent(
        "context_preparer",
        `Prepare a detailed context package for the following goal: ${state.goal}`
      );
      return { context_package };
    };

    const planningTeamNode = async (state) => {
      console.log(chalk.blue("--- SUPERVISOR: INVOKING PLANNING TEAM ---"));
      const planningResult = await this.planningGraph.invoke({
        goal: state.goal,
        context: state.context_package,
      });
      // Use tasks from the planning result
      const tasks = planningResult.tasks || [{ task: "Default task if none provided", code: "" }];
      return {
        architecture_plan: planningResult.architecture_plan,
        tasks: tasks,
      };
    };

    const executionTeamNode = async (state) => {
      console.log(chalk.blue("--- SUPERVISOR: INVOKING EXECUTION TEAM ---"));
      try {
        const tasksWithContext = state.tasks.map((task) => ({
          ...task,
          architecture_plan: state.architecture_plan,
        }));
        const executionResults = await this.executionGraph.batch(tasksWithContext);
        return {
          last_result: executionResults,
          decision: "success",
          tasks_completed: state.tasks.length,
        };
      } catch (error) {
        console.error(chalk.red(`--- SUPERVISOR: EXECUTION FAILED ---`));
        console.error(error);
        return { last_error: error.message, decision: "failure" };
      }
    };

    const periodicReviewNode = async (state) => {
      console.log(chalk.green("--- SUPERVISOR: CONDUCTING PERIODIC REVIEW ---"));
      const prompt = `We have completed ${state.tasks_completed} tasks. Review the remaining tasks in the plan against the original goal. Are there any optimizations, parallelizations, or de-prioritizations that can be made based on the work completed so far? If so, provide an updated task list.`;
      const review_result = await this.triggerAgent("@dispatcher", prompt);
      // Assuming dispatcher might return an updated task list or nothing
      if (review_result && review_result.tasks) {
        console.log(chalk.yellow("--- SUPERVISOR: PLAN HAS BEEN UPDATED ---"));
        return { tasks: review_result.tasks };
      }
      console.log(chalk.green("--- SUPERVISOR: NO CHANGES TO THE PLAN ---"));
      return {};
    };

    const selfCorrectionNode = async (state) => {
      console.log(chalk.red("--- SUPERVISOR: ENTERING SELF-CORRECTION ---"));
      const { tasks, last_error } = state;
      const failedTask = JSON.stringify(tasks); // Assuming the whole batch is the context
      const prompt = `The execution of task '${failedTask}' failed with the error '${last_error}'. Query the Swarm Memory for past lessons related to this type of failure and propose a new, corrected plan of action. This could involve using a different agent, a different tool, or breaking the task down further.`;

      const revised_plan = await this.triggerAgent("@metis", prompt);

      // For now, let's assume metis returns a new list of tasks
      // In a real scenario, we'd parse this properly
      const new_tasks = [{ task: `Corrected: ${revised_plan}`, code: "" }];
      console.log(chalk.yellow("--- SUPERVISOR: RETRYING WITH REVISED PLAN ---"));
      return { tasks: new_tasks };
    };

    const humanApprovalNode = (state) => {
      console.log(chalk.yellow("--- SUPERVISOR: AWAITING HUMAN APPROVAL ---"));
      if (state.user_feedback !== "proceed") {
        return interrupt();
      }
    };

    workflow.addNode("context_preparer_node", contextPreparerNode.bind(this));
    workflow.addNode("planning_team", planningTeamNode.bind(this));
    workflow.addNode("execution_team", executionTeamNode.bind(this));
    workflow.addNode("human_approval", humanApprovalNode.bind(this));
    workflow.addNode("self_correction_node", selfCorrectionNode.bind(this));
    workflow.addNode("periodic_review_node", periodicReviewNode.bind(this));

    workflow.setEntryPoint("context_preparer_node");
    workflow.addEdge("context_preparer_node", "planning_team");
    workflow.addEdge("planning_team", "human_approval");

    workflow.addConditionalEdges(
      "human_approval",
      (state) => {
        // This log will now correctly show the updated feedback.
        console.log(
          chalk.magenta(`--- SUPERVISOR ROUTER: User feedback is '${state.user_feedback}' ---`)
        );
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

    // Conditional edge from execution_team
    workflow.addConditionalEdges(
      "execution_team",
      (state) => {
        console.log(
          chalk.magenta(
            `--- SUPERVISOR ROUTER: Execution result is '${state.decision}', tasks completed: ${state.tasks_completed} ---`
          )
        );
        if (state.decision === "failure") {
          return "self_correction_node";
        }
        if (state.tasks_completed >= REVIEW_FREQUENCY) {
          return "periodic_review_node";
        }
        return "__end__";
      },
      {
        self_correction_node: "self_correction_node",
        periodic_review_node: "periodic_review_node",
        __end__: END,
      }
    );

    // Loop back from self-correction to execution
    workflow.addEdge("self_correction_node", "execution_team");
    workflow.addEdge("periodic_review_node", END);

    return workflow.compile({ checkpointer });
  }

  async triggerAgent(agentId, prompt) {
    console.log(`[Engine] Triggering agent ${agentId}`);
    // Mocking agent response for now
    if (agentId === "@metis") {
      return "Use tool X instead of Y";
    }
    if (agentId === "@dispatcher") {
      return { tasks: null }; // No changes
    }
    return `Result from ${agentId}`;
  }
}
