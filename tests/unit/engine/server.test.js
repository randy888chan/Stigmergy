import { Engine } from "../../../engine/server.js";
import { vol } from "memfs";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

// Mock fs-extra to use memfs
jest.mock("fs-extra", () => {
  const memfs = jest.requireActual("memfs");
  const actualFsExtra = jest.requireActual("fs-extra");
  return {
    ...actualFsExtra, // Use actual for functions not in memfs
    ...memfs.fs,
    existsSync: memfs.fs.existsSync,
    readFileSync: memfs.fs.readFileSync,
    readdir: memfs.fs.readdir,
  };
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to create valid agent content
const createAgentContent = (id, name) => `
\`\`\`yaml
agent:
  id: ${id}
  name: ${name}
  model_tier: utility_tier
  persona:
    role: Test agent
    identity: A test agent
  core_protocols:
    - "Test protocol"
\`\`\`
This is a test agent.
`;

describe("Engine Agent Loading", () => {
  let engine;

  beforeEach(() => {
    vol.reset();
    engine = new Engine();
  });

  it("should load an agent from the global package path if no local override exists", () => {
    const globalAgentPath = path.resolve(
      __dirname,
      "../../../.stigmergy-core/agents/global-agent.md"
    );
    vol.fromJSON({
      [globalAgentPath]: createAgentContent("global-agent", "Global Agent"),
    });

    const agent = engine.getAgent("global-agent");
    expect(agent.id).toBe("global-agent");
    expect(agent.systemPrompt).toContain("Global Agent");
  });

  it("should load an agent from the local override path if it exists", () => {
    const globalAgentPath = path.resolve(
      __dirname,
      "../../../.stigmergy-core/agents/test-agent.md"
    );
    const localAgentPath = path.join(process.cwd(), ".stigmergy/agents/test-agent.md");

    vol.fromJSON({
      [globalAgentPath]: createAgentContent("test-agent", "Global Test Agent"),
      [localAgentPath]: createAgentContent("test-agent", "Local Override Agent"),
    });

    const agent = engine.getAgent("test-agent");
    expect(agent.id).toBe("test-agent");
    expect(agent.systemPrompt).toContain("Local Override Agent");
    expect(agent.systemPrompt).not.toContain("Global Test Agent");
  });

  it("should load an agent from the local path even if no global version exists", () => {
    const localAgentPath = path.join(process.cwd(), ".stigmergy/agents/local-only-agent.md");

    vol.fromJSON({
      [localAgentPath]: createAgentContent("local-only-agent", "Local Only Agent"),
    });

    const agent = engine.getAgent("local-only-agent");
    expect(agent.id).toBe("local-only-agent");
    expect(agent.systemPrompt).toContain("Local Only Agent");
  });

  it("should throw an error if the agent does not exist in either location", () => {
    // Setup an empty filesystem
    vol.fromJSON({});

    expect(() => {
      engine.getAgent("non-existent-agent");
    }).toThrow(
      "Agent definition file not found for: @non-existent-agent. Searched for local override and in global package."
    );
  });
});
