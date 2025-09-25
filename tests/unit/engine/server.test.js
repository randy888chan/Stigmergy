import { vol } from "memfs";
import path from "path";
import { mock, describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';

mock.module('hono', () => ({
  Hono: class {
    get = mock();
    post = mock();
    use = mock();
    fetch = mock();
    listen = mock();
  }
}));

// Mock fs-extra to use memfs
mock.module('fs-extra', () => {
  const memfs = require('memfs'); // Use require here for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: memfs.fs.exists.bind(null),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
        pathExists: memfs.fs.exists.bind(null),
    }
  };
});

describe("Engine WebSocket Message Handling", () => {
  let Engine;
  let engine;
  let mockWss;
  let mockWs;

  beforeEach(async () => {
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;

    // Mock the WebSocket server and client
    mockWs = {
      on: mock(),
      close: mock(),
      send: mock(),
      readyState: 1, // WebSocket.OPEN
    };

    mockWss = {
      on: mock((event, callback) => {
        if (event === 'connection') {
          callback(mockWs);
        }
      }),
      clients: [mockWs],
    };

    // Create a new engine instance
    engine = new Engine();

    // We need to mock parts of the engine's setup that interact with the filesystem or network
    spyOn(engine.stateManager, 'on').mockImplementation(() => {});
    spyOn(engine.app, 'listen').mockImplementation((port, cb) => cb());


    // Replace the engine's wss with our mock
    engine.wss = mockWss;

    // Spy on agent-related methods
    spyOn(engine, 'getAgent').mockImplementation((agentId) => ({ id: agentId, systemPrompt: 'mock prompt' }));
    spyOn(engine, 'triggerAgent').mockResolvedValue({});

    // Start the engine to attach the message handlers
    await engine.start();
  });

  afterEach(() => {
    mock.restore();
    engine.stop();
  });

  test('should trigger the @system agent on user_chat_message', async () => {
    // Find the message handler assigned by the engine during start()
    const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];

    const message = {
      type: 'user_chat_message',
      payload: { prompt: 'test prompt' },
    };

    await messageHandler(JSON.stringify(message));

    expect(engine.getAgent).toHaveBeenCalledWith('system');
    expect(engine.triggerAgent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'system' }),
      'test prompt'
    );
  });

  test('should handle clarification_response messages without triggering an agent', async () => {
    const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
    const message = {
      type: 'clarification_response',
      payload: { some: 'data' },
    };

    await messageHandler(JSON.stringify(message));
    expect(engine.triggerAgent).not.toHaveBeenCalled();
  });

  test('should handle unknown message types gracefully without triggering an agent', async () => {
    const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
    const message = {
      type: 'unknown_type',
      payload: {},
    };

    await messageHandler(JSON.stringify(message));
    expect(engine.triggerAgent).not.toHaveBeenCalled();
  });
});

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
  let Engine;
  let engine;

  beforeEach(async () => {
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;
    vol.reset();
    engine = new Engine();
  });

  test("should load an agent from the global package path if no local override exists", () => {
    const globalAgentPath = path.resolve(process.cwd(), ".stigmergy-core/agents/global-agent.md");
    vol.fromJSON({
      [globalAgentPath]: createAgentContent("global-agent", "Global Agent"),
    });

    const agent = engine.getAgent("global-agent");
    expect(agent.id).toBe("global-agent");
    expect(agent.systemPrompt).toContain("Global Agent");
  });

  test("should load an agent from the local override path if it exists", () => {
    const globalAgentPath = path.resolve(process.cwd(), ".stigmergy-core/agents/test-agent.md");
    const localAgentPath = path.join(process.cwd(), ".stigmergy-core/agents/test-agent.md");

    vol.fromJSON({
      [globalAgentPath]: createAgentContent("test-agent", "Global Test Agent"),
      [localAgentPath]: createAgentContent("test-agent", "Local Override Agent"),
    });

    const agent = engine.getAgent("test-agent");
    expect(agent.id).toBe("test-agent");
    expect(agent.systemPrompt).toContain("Local Override Agent");
    expect(agent.systemPrompt).not.toContain("Global Test Agent");
  });

  test("should load an agent from the local path even if no global version exists", () => {
    const localAgentPath = path.join(process.cwd(), ".stigmergy-core/agents/local-only-agent.md");

    vol.fromJSON({
      [localAgentPath]: createAgentContent("local-only-agent", "Local Only Agent"),
    });

    const agent = engine.getAgent("local-only-agent");
    expect(agent.id).toBe("local-only-agent");
    expect(agent.systemPrompt).toContain("Local Only Agent");
  });

  test("should throw an error if the agent does not exist in either location", () => {
    // Setup an empty filesystem
    vol.fromJSON({});

    expect(() => {
      engine.getAgent("non-existent-agent");
    }).toThrow(
      "Agent definition file not found for: @non-existent-agent. Searched for local override and in global package."
    );
  });
});
