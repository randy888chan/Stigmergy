import { END, StateGraph } from "@langchain/langgraph";

const graphState = {
  task: { value: null },
  code: { value: null },
  qa_feedback: { value: null },
  retries: { value: (x, y) => x + y, default: () => 0 },
  architecture_plan: { value: null },
  choice: { value: null },
};

let triggerAgent;

const dispatcherNode = async (state) => {
  const choice = await triggerAgent("dispatcher", state.task);
  return { choice };
};

const devNode = async (state) => {
  const code = await triggerAgent("dev", state.task);
  return { code };
};

const geminiNode = async (state) => {
  const code = await triggerAgent("gemini-executor", state.task);
  return { code };
};

const qaNode = async (state) => {
  const qa_feedback = await triggerAgent("qa", `Code: ${state.code}\nArchitecture Plan: ${state.architecture_plan}`);
  return { qa_feedback };
};

const debuggerNode = async (state) => {
  const newTask = await triggerAgent("debugger", `QA Feedback: ${state.qa_feedback}\nCode: ${state.code}`);
  return { task: newTask, retries: 1 };
};

const shouldContinue = (state) => {
  if (state.qa_feedback === "PASS") {
    return "end";
  } else {
    return "debugger";
  }
};

export const createExecutionGraph = (agentTrigger) => {
  triggerAgent = agentTrigger;

  const executionGraph = new StateGraph({
    channels: graphState,
  });

  executionGraph.addNode("dispatcher", dispatcherNode);
  executionGraph.addNode("dev", devNode);
  executionGraph.addNode("gemini-executor", geminiNode);
  executionGraph.addNode("qa", qaNode);
  executionGraph.addNode("debugger", debuggerNode);

  executionGraph.setEntryPoint("dispatcher");
  executionGraph.addConditionalEdges("dispatcher", (state) => {
    if (state.choice === "gemini") {
      return "gemini-executor";
    }
    return "dev";
  }, {
    "gemini-executor": "gemini-executor",
    "dev": "dev",
  });
  executionGraph.addEdge("dev", "qa");
  executionGraph.addEdge("gemini-executor", "qa");
  executionGraph.addConditionalEdges("qa", shouldContinue, {
    end: END,
    debugger: "debugger",
  });
  executionGraph.addEdge("debugger", "dispatcher");

  return executionGraph.compile();
};
