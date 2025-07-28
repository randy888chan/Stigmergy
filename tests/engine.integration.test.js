const request = require('supertest');
const fs = require('fs-extra');
const path = require('path');
const stateManager = require('../engine/state_manager');
const llmAdapter = require('../engine/llm_adapter');
const { _appForTesting: app, stopEngineLoop, mainEngineLoop } = require('../engine/server'); // Assuming server exports these for tests

// Mock the LLM adapter to prevent actual API calls
jest.mock('../engine/llm_adapter');

const STATE_FILE = path.resolve(process.cwd(), '.ai', 'state.json');

// Mute console logs during tests for cleaner output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Autonomous Engine Integration Test', () => {
  
  beforeEach(async () => {
    // Reset state and mocks before each test
    await fs.remove(path.dirname(STATE_FILE));
    jest.clearAllMocks();
    await stopEngineLoop('Test Setup');
  });

  afterAll(async () => {
    await fs.remove(path.dirname(STATE_FILE));
    jest.restoreAllMocks(); // Restore console logging
  });

  test('should autonomously run the Grand Blueprint Phase', async () => {
    // --- Mock the sequence of agent actions ---

    // 1. Analyst runs, creates docs, and updates status
    llmAdapter.getCompletion.mockResolvedValueOnce({
      thought: 'I will research the topic and create the brief and research docs.',
      action: {
        tool: 'system.updateStatus',
        args: { status: 'GRAND_BLUEPRINT_PHASE', message: 'Brief complete.' }
      }
    });
    
    // 2. PM runs, creates PRD, and updates status
    llmAdapter.getCompletion.mockResolvedValueOnce({
      thought: 'I will create the PRD based on the brief.',
      action: {
        tool: 'system.updateStatus',
        args: { status: 'GRAND_BLUEPRINT_PHASE', message: 'PRD complete.' }
      }
    });

    // 3. Architect runs, creates architecture, and transitions to approval
    llmAdapter.getCompletion.mockResolvedValueOnce({
      thought: 'I will create the architecture documents.',
      action: {
        tool: 'system.updateStatus',
        args: { status: 'AWAITING_EXECUTION_APPROVAL', message: 'Architecture complete.' }
      }
    });

    // --- Start the Test ---
    
    // Step 1: User starts the project
    await request(app)
      .post('/api/system/start')
      .send({ goal: 'Test autonomous planning' })
      .expect(200);

    // Give the engine time to run through the mocked sequence
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Manually trigger a few loop cycles to simulate the engine running
    await mainEngineLoop();
    await new Promise(resolve => setTimeout(resolve, 100));
    await mainEngineLoop();
    await new Promise(resolve => setTimeout(resolve, 100));
    await mainEngineLoop();
    
    // --- Assertions ---
    
    // Verify that the agents were called in the correct order
    expect(llmAdapter.getCompletion).toHaveBeenCalledWith('analyst', expect.any(String), null);
    expect(llmAdapter.getCompletion).toHaveBeenCalledWith('pm', expect.any(String), null);
    expect(llmAdapter.getCompletion).toHaveBeenCalledWith('design-architect', expect.any(String), null);
    
    // Check the final state of the project
    const finalState = await stateManager.getState();
    expect(finalState.project_status).toBe('AWAITING_EXECUTION_APPROVAL');
  });
});
