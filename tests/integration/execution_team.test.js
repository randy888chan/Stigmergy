import { createExecutionGraph } from "../../engine/execution_graph.js";

describe("Execution Team Graph", () => {
  let executionGraph;
  let triggerAgent;

  beforeEach(() => {
    // Mock the triggerAgent function
    triggerAgent = jest.fn();
    // Create a new graph for each test
    executionGraph = createExecutionGraph(triggerAgent);
  });

  test("should follow the @dev path successfully", async () => {
    // Supervisor decides 'dev'
    triggerAgent.mockResolvedValueOnce("dev");
    // Dev agent produces code
    triggerAgent.mockResolvedValueOnce("const a = 1;");
    // QA agent passes the code
    triggerAgent.mockResolvedValueOnce("PASS");

    const finalState = await executionGraph.invoke({
      task: "Create a simple variable",
    });

    expect(triggerAgent).toHaveBeenCalledWith("dispatcher", expect.any(String));
    expect(triggerAgent).toHaveBeenCalledWith("dev", "Create a simple variable");
    expect(triggerAgent).toHaveBeenCalledWith("qa", expect.stringContaining("const a = 1;"));
    expect(finalState.code).toBe("const a = 1;");
    expect(finalState.qa_feedback).toBe("PASS");
  });

  test("should follow the @gemini-executor path successfully", async () => {
    // Supervisor decides 'gemini'
    triggerAgent.mockResolvedValueOnce("gemini");
    // Gemini agent produces code
    triggerAgent.mockResolvedValueOnce("const b = 2;");
    // QA agent passes the code
    triggerAgent.mockResolvedValueOnce("PASS");

    const finalState = await executionGraph.invoke({
      task: "Create another simple variable",
    });

    expect(triggerAgent).toHaveBeenCalledWith("dispatcher", expect.any(String));
    expect(triggerAgent).toHaveBeenCalledWith("gemini-executor", "Create another simple variable");
    expect(triggerAgent).toHaveBeenCalledWith("qa", expect.stringContaining("const b = 2;"));
    expect(finalState.code).toBe("const b = 2;");
    expect(finalState.qa_feedback).toBe("PASS");
  });

  test("should loop through the debugger on QA failure", async () => {
    // Supervisor decides 'dev'
    triggerAgent.mockResolvedValueOnce("dev");
    // Dev agent produces buggy code
    triggerAgent.mockResolvedValueOnce("const c = 3; // buggy");
    // QA agent fails the code
    triggerAgent.mockResolvedValueOnce("FAIL: It has a bug.");
    // Debugger provides a new task
    triggerAgent.mockResolvedValueOnce("Fixed the bug in const c.");
    // Supervisor decides 'dev' again
    triggerAgent.mockResolvedValueOnce("dev");
    // Dev agent produces fixed code
    triggerAgent.mockResolvedValueOnce("const c = 3;");
    // QA agent passes the fixed code
    triggerAgent.mockResolvedValueOnce("PASS");

    const finalState = await executionGraph.invoke({
      task: "Create a third simple variable",
    });

    expect(triggerAgent).toHaveBeenCalledTimes(7);
    expect(triggerAgent).toHaveBeenCalledWith("debugger", expect.stringContaining("buggy"));
    expect(finalState.code).toBe("const c = 3;");
    expect(finalState.qa_feedback).toBe("PASS");
    expect(finalState.retries).toBe(1);
  });
});
