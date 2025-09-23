import { Engine } from '../../engine/server.js';
import WebSocket from 'ws';
import { jest } from '@jest/globals';

// Increase timeout for E2E tests
jest.setTimeout(30000);

describe('User Workflow E2E Tests', () => {
  let engine;
  let ws;
  let triggerAgentSpy;

  beforeAll(async () => {
    process.env.STIGMERGY_PORT = 3012;
    engine = new Engine();

    // Spy on triggerAgent and mock its implementation
    triggerAgentSpy = jest.spyOn(engine, 'triggerAgent').mockImplementation(async (agent, prompt) => {
      if (prompt.includes('what is the system status')) {
        const result = await engine.executeTool('chat_interface.process_chat_command', { command: 'what is the system status' }, agent.id);
        engine.broadcastEvent('tool_end', { tool: 'chat_interface.process_chat_command', result });
      } else {
        const result = await engine.executeTool('chat_interface.process_chat_command', { command: "Create a simple javascript function that returns 'hello world'" }, agent.id);
        engine.broadcastEvent('tool_end', { tool: 'chat_interface.process_chat_command', result });
      }
      return { toolCall: { tool: 'mocked.tool', args: {} } };
    });

    await engine.initialize();
    await engine.start();
  });

  afterAll(async () => {
    if (engine) {
      await engine.stop();
    }
    triggerAgentSpy.mockRestore();
  });

  beforeEach((done) => {
    const port = process.env.STIGMERGY_PORT || 3012;
    ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('open', () => {
      done();
    });
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      done(err);
    });
  });

  afterEach(() => {
    if (ws) {
      ws.close();
    }
    jest.clearAllMocks();
  });

  test('should successfully initiate a task via chat message', (done) => {
    const onMessage = (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'state_update') {
          const { project_status } = data.payload;
          if (project_status === 'ENRICHMENT_PHASE' || project_status === 'GRAND_BLUEPRINT_PHASE') {
            ws.removeListener('message', onMessage);
            done();
          }
        }
      } catch(e) {
        ws.removeListener('message', onMessage);
        done(e);
      }
    };
    ws.on('message', onMessage);

    const prompt = "Create a simple javascript function that returns 'hello world'";
    ws.send(JSON.stringify({
      type: 'user_chat_message',
      payload: { prompt },
    }));
  });

  test('should respond with system status when asked', (done) => {
    const onMessage = (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'tool_end' && data.payload.tool === 'chat_interface.process_chat_command') {
          const { result } = data.payload;
          const parsedResult = JSON.parse(result);
          if (parsedResult && parsedResult.message.includes('Health check completed')) {
            ws.removeListener('message', onMessage);
            done();
          }
        }
      } catch (error) {
        // Ignore parse errors, we are looking for a specific message
      }
    };
    ws.on('message', onMessage);

    const prompt = "what is the system status";
    ws.send(JSON.stringify({
      type: 'user_chat_message',
      payload: { prompt },
    }));
  });
});
