const fs = require("fs-extra");
const { getNextAction } = require("../engine/agent_dispatcher");

jest.mock("fs-extra");

describe("Agent Dispatcher Logic", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch @analyst to create a brief when nothing exists", async () => {
    const state = { project_status: "NEEDS_BRIEFING", goal: "Test Goal" };
    fs.pathExists.mockResolvedValue(false);

    const action = await getNextAction(state);
    expect(action.agent).toBe("analyst");
    expect(action.newStatus).toBe("NEEDS_BRIEFING");
    expect(action.task).toContain("Create a 'docs/brief.md'");
  });

  it("should dispatch @pm to create a PRD when only a brief exists", async () => {
    const state = { project_status: "NEEDS_PRD" };
    // Mock that docs/brief.md exists, but nothing else
    fs.pathExists.mockImplementation(p => Promise.resolve(p.endsWith('docs/brief.md')));

    const action = await getNextAction(state);
    expect(action.agent).toBe("pm");
    expect(action.newStatus).toBe("NEEDS_PRD");
  });

  it("should dispatch @design-architect for architecture when PRD exists", async () => {
    const state = { project_status: "NEEDS_ARCHITECTURE" };
    // Mock that brief and prd exist
    fs.pathExists.mockImplementation(p => Promise.resolve(p.endsWith('docs/brief.md') || p.endsWith('docs/prd.md')));
    
    const action = await getNextAction(state);
    expect(action.agent).toBe("design-architect");
    expect(action.newStatus).toBe("NEEDS_ARCHITECTURE");
  });

  it("should dispatch an execution task when a blueprint exists with pending tasks", async () => {
    const state = {
      project_status: "READY_FOR_EXECUTION",
      project_manifest: {
        tasks: [{ id: "T01", summary: "Do the thing", agent: "james", status: "PENDING" }]
      }
    };
    fs.pathExists.mockResolvedValue(true); // blueprint exists

    const action = await getNextAction(state);
    expect(action.type).toBe("EXECUTION_TASK");
    expect(action.agent).toBe("james");
    expect(action.taskId).toBe("T01");
  });

  it("should enter a waiting state if all tasks are complete", async () => {
    const state = {
      project_status: "EXECUTION_IN_PROGRESS",
      project_manifest: {
        tasks: [{ id: "T01", summary: "Do the thing", agent: "james", status: "COMPLETED" }]
      }
    };
    fs.pathExists.mockResolvedValue(true);

    const action = await getNextAction(state);
    expect(action.type).toBe("SYSTEM_TASK");
    expect(action.newStatus).toBe("PROJECT_COMPLETE");
  });
});
