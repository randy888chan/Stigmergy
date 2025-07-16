const fs = require("fs-extra");
const { getNextAction } = require("../engine/agent_dispatcher");

jest.mock("fs-extra");

describe("Agent Dispatcher Logic", () => {
  beforeEach(() => {
    fs.pathExists.mockReset();
  });

  it("should dispatch @analyst to create a brief when nothing exists", async () => {
    const state = { project_status: "NEEDS_BRIEFING", goal: "Test Goal" };
    fs.pathExists.mockResolvedValue(false);

    const action = await getNextAction(state);
    expect(action.agent).toBe("analyst");
    expect(action.newStatus).toBe("AWAITING_APPROVAL_BRIEF");
  });

  it("should dispatch @pm when brief exists but PRD does not", async () => {
    const state = { project_status: "NEEDS_PRD" };
    fs.pathExists.mockImplementation(p => Promise.resolve(p.endsWith('docs/brief.md')));

    const action = await getNextAction(state);
    expect(action.agent).toBe("pm");
    expect(action.newStatus).toBe("AWAITING_APPROVAL_PRD");
  });
  
  it("should pause when a milestone is awaiting approval", async () => {
    const state = { project_status: "AWAITING_APPROVAL_BRIEF" };
    const action = await getNextAction(state);
    expect(action.type).toBe("WAITING_FOR_APPROVAL");
  });

  it("should ingest blueprint when one exists and is not yet in state", async () => {
    const state = { project_status: "NEEDS_BLUEPRINT" };
    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue("tasks:\n  - id: T01");
    
    const action = await getNextAction(state);
    expect(action.type).toBe("SYSTEM_TASK");
    expect(action.task).toBe("INGEST_BLUEPRINT");
    expect(action.newStatus).toBe("READY_FOR_EXECUTION");
  });
});
