import { StateGraph, END } from "@langchain/langgraph";

// Define the state for the execution graph
export const executionState = {
  task: {},
  code: {},
  architecture_plan: {},
  qa_feedback: {},
  retries: { value: (a, b) => (a ?? 0) + (b ?? 0) },
  supervisor_decision: {},
  qa_decision: {},
};

export function createExecutionGraph(triggerAgent) {
  const executionGraphBuilder = new StateGraph({ channels: executionState });

  // 1. Nodes
  const supervisorNode = async (state) => {
    console.log("[Execution Team] Supervisor deciding...");
    const prompt = `Based on the task, which executor should I use?
    - 'dev' for general-purpose development and legacy code modifications
    - 'gemini' for quick prototypes and boilerplate code generation  
    - 'qwen' for complex algorithms, optimization, and advanced coding patterns
    
    Respond with 'dev', 'gemini', or 'qwen'.

TASK:
${state.task}`;
    const decision = await triggerAgent("dispatcher", prompt);
    
    if (decision.toLowerCase().includes("qwen")) {
      return { supervisor_decision: "qwen" };
    } else if (decision.toLowerCase().includes("gemini")) {
      return { supervisor_decision: "gemini" };
    } else {
      return { supervisor_decision: "dev" };
    }
  };

  const devAgentNode = async (state) => {
    console.log("[Execution Team] Invoking @dev agent");
    const code = await triggerAgent("dev", state.task);
    return { code };
  };

  const geminiExecutorNode = async (state) => {
    console.log("[Execution Team] Invoking @gemini-executor agent");
    const code = await triggerAgent("gemini-executor", state.task);
    return { code };
  };

  const qwenExecutorNode = async (state) => {
    console.log("[Execution Team] Invoking @qwen-executor agent");
    const code = await triggerAgent("qwen-executor", state.task);
    return { code };
  };

  const qaAgentNode = async (state) => {
    console.log("[Execution Team] QA Agent checking code...");
    const architecturePlanInfo = state.architecture_plan
      ? `\n\nAlso, ensure the code complies with the following architectural plan:\n${state.architecture_plan}`
      : "";

    const prompt = `Please review the following code and determine if it meets the requirements. Respond with "PASS" or "FAIL" followed by your feedback.\n\nCODE:\n${state.code}\n\nTASK:\n${state.task}${architecturePlanInfo}`;
    const feedback = await triggerAgent("qa", prompt);
    const decision = feedback.toUpperCase().includes("PASS") ? "end" : "debugger";
    return { qa_feedback: feedback, qa_decision: decision };
  };

  const debuggerNode = async (state) => {
    console.log("[Execution Team] Debugger agent analyzing failure...");
    const prompt = `The previous attempt failed QA. Analyze the code, the task, and the QA feedback to provide a fix.\n\nCODE:\n${state.code}\n\nTASK:\n${state.task}\n\nQA FEEDBACK:\n${state.qa_feedback}`;
    // The debugger's output will become the new "task" for the next loop
    const newTask = await triggerAgent("debugger", prompt);
    return { task: newTask, retries: 1 };
  };

  executionGraphBuilder.addNode("supervisor", supervisorNode);
  executionGraphBuilder.addNode("dev_agent", devAgentNode);
  executionGraphBuilder.addNode("gemini_executor_agent", geminiExecutorNode);
  executionGraphBuilder.addNode("qwen_executor_agent", qwenExecutorNode);
  executionGraphBuilder.addNode("qa_agent", qaAgentNode);
  executionGraphBuilder.addNode("debugger_agent", debuggerNode);

  // 2. Edges
  executionGraphBuilder.setEntryPoint("supervisor");

  executionGraphBuilder.addConditionalEdges("supervisor", (state) => {
    if (state.supervisor_decision === "gemini") {
      return "gemini_executor_agent";
    } else if (state.supervisor_decision === "qwen") {
      return "qwen_executor_agent";
    }
    return "dev_agent";
  });

  executionGraphBuilder.addEdge("dev_agent", "qa_agent");
  executionGraphBuilder.addEdge("gemini_executor_agent", "qa_agent");
  executionGraphBuilder.addEdge("qwen_executor_agent", "qa_agent");

  executionGraphBuilder.addConditionalEdges("qa_agent", (state) => {
    if (state.qa_decision === "end") {
      return END;
    }
    return "debugger_agent";
  });

  executionGraphBuilder.addEdge("debugger_agent", "supervisor"); // The autonomous review cycle

  // Export the compiled graph
  return executionGraphBuilder.compile();
}
