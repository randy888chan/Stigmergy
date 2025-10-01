import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Engine } from '../../../engine/server.js';
import path from 'path';
import { Volume } from 'memfs';

// --- 1. Setup In-Memory File System & Mock ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);
const mockFs = {
  // Add all necessary fs-extra methods
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  existsSync: memfs.existsSync,
  promises: memfs.promises,
};
mockFs.default = mockFs;

// --- 2. Mock the fs-extra module for the entire test file ---
mock.module('fs-extra', () => mockFs);

// --- 3. Mock the StateManager ---
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    on: mock(),
    emit: mock(),
};

describe('Human Handoff Workflow', () => {
  let engine;

  beforeEach(() => {
    vol.reset(); // Clear the in-memory file system

    // --- 4. Create mock agent files in-memory ---
    const agentDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    mockFs.ensureDirSync(agentDir);
    const mockDispatcherAgent = `
\`\`\`yaml
agent:
  id: "dispatcher"
  engine_tools:
    - "system.request_human_approval"
\`\`\`
`;
    mockFs.writeFileSync(path.join(agentDir, 'dispatcher.md'), mockDispatcherAgent);

    // Inject the mock StateManager when creating the engine
    engine = new Engine({
        stateManager: mockStateManagerInstance
    });
  });

  afterEach(() => {
      mock.restore();
  });

  test('Dispatcher should be able to call the request_human_approval tool', async () => {
    // Spy on the engine's broadcastEvent method. This is our verification point.
    const broadcastSpy = mock(engine.broadcastEvent);
    engine.broadcastEvent = broadcastSpy;

    // Simulate a tool call from the @dispatcher agent.
    await engine.executeTool.execute(
      'system.request_human_approval',
      { message: 'Approve plan?', data: { content: 'plan details' } },
      'dispatcher'
    );

    // Assert that the broadcast event was called with the correct payload.
    expect(broadcastSpy).toHaveBeenCalledWith(
      'human_approval_request',
      { message: 'Approve plan?', data: { content: 'plan details' } }
    );
  });
});