import { StateGraph, END } from "@langchain/langgraph";
import { add } from "@langchain/langgraph/prebuilt";

// Define the state for the execution graph
export const executionState = {
  task: null, // The task description and context
  code: null, // The generated or modified code
  qa_feedback: null, // Feedback from the QA agent
  retries: (a, b) => (a ?? 0) + (b ?? 0),
  // Internal state
  supervisor_decision: null,
  qa_decision: null,
};

export function createExecutionGraph(triggerAgent) {
  const executionGraphBuilder = new StateGraph({ channels: executionState });

  // 1. Nodes
  const supervisorNode = async (state) => {
    console.log("[Execution Team] Supervisor deciding...");
    const prompt = `Based on the task, should I use the general-purpose @dev agent for complex modifications or the @gemini-executor for new, boilerplate code? Respond with 'dev' or 'gemini'.\n\nTASK:\n${state.task}`;
    const decision = await triggerAgent("dispatcher", prompt); // Using dispatcher as a generic decider
    return { supervisor_decision: decision.toLowerCase().includes("gemini") ? "gemini" : "dev" };
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

  const qaAgentNode = async (state) => {
    console.log("[Execution Team] QA Agent checking code...");
    const prompt = `Please review the following code and determine if it meets the requirements. Respond with "PASS" or "FAIL" followed by your feedback.\n\nCODE:\n${state.code}\n\nTASK:\n${state.task}`;
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
  executionGraphBuilder.addNode("qa_agent", qaAgentNode);
  executionGraphBuilder.addNode("debugger_agent", debuggerNode);

  // 2. Edges
  executionGraphBuilder.setEntryPoint("supervisor");

  executionGraphBuilder.addConditionalEdges("supervisor", (state) => {
    if (state.supervisor_decision === "gemini") {
      return "gemini_executor_agent";
    }
    return "dev_agent";
  });

  executionGraphBuilder.addEdge("dev_agent", "qa_agent");
  executionGraphBuilder.addEdge("gemini_executor_agent", "qa_agent");

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
