import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Engine } from '../../../engine/server.js';
import { createExecutor } from '../../../engine/tool_executor.js'; // Import the executor
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
  let executeTool;
  let mockEngine;
  let broadcastSpy;

  beforeEach(() => {
    vol.reset(); // Clear the in-memory file system

    // --- 4. Create mock agent & trajectory directories in-memory ---
    const agentDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    const trajectoryDir = path.join(process.cwd(), '.stigmergy', 'trajectories');
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(trajectoryDir); // For clean test output

    const mockDispatcherAgent = `
\`\`\`yaml
agent:
  id: "dispatcher"
  engine_tools:
    - "system.request_human_approval"
\`\`\`
`;
    mockFs.writeFileSync(path.join(agentDir, 'dispatcher.md'), mockDispatcherAgent);

    // --- 5. Setup mock engine and executor ---
    broadcastSpy = mock(() => {});
    mockEngine = {
        stateManager: mockStateManagerInstance,
        broadcastEvent: broadcastSpy,
        projectRoot: process.cwd(),
    };

    // The executor is now created directly, mirroring the real engine flow
    executeTool = createExecutor(mockEngine, {}, {});
  });

  afterEach(() => {
      mock.restore();
  });

  test('Dispatcher should be able to call the request_human_approval tool', async () => {
    // Simulate a tool call from the @dispatcher agent.
    await executeTool.execute(
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