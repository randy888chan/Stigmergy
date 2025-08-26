import { Engine } from '../../engine/server.js';
import axios from 'axios';

describe('Engine Server API', () => {
  let engine;
  let server;

  beforeAll(async () => {
    engine = new Engine();
    await engine.initialize();
    // Start the server and keep a reference to it
    await new Promise(resolve => {
      server = engine.app.listen(3001, () => {
        console.log('Test server running on port 3001');
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Stop the engine loop and close the server
    await engine.stop();
  });

  it('should respond to a POST request at /api/chat', async () => {
    const response = await axios.post('http://localhost:3001/api/chat', {
      agentId: 'test-agent',
      prompt: 'Hello, engine!'
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ response: 'Acknowledged. Task for @test-agent: Hello, engine!' });
  });
});
