import { Engine } from '../../engine/server.js';
import axios from 'axios';
import { JSDOM } from 'jsdom';

describe('Engine Server', () => {
  let engine;
  const port = 3002;
  const baseURL = `http://localhost:${port}`;

  beforeAll(async () => {
    engine = new Engine();
    await engine.initialize();
    await new Promise(resolve => {
      engine.server.listen(port, () => {
        console.log(`Test server running on port ${port}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    await engine.stop();
  });

  describe('API Endpoints', () => {
    it('should respond to a POST request at /api/chat', async () => {
      const response = await axios.post(`${baseURL}/api/chat`, {
        agentId: 'test-agent',
        prompt: 'Hello, engine!'
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ response: 'Task for @test-agent acknowledged.' });
    });
  });

  describe('Dashboard Frontend', () => {
    it('should serve the dashboard at the root URL', async () => {
      const response = await axios.get(baseURL);
      expect(response.status).toBe(200);

      const dom = new JSDOM(response.data);
      const title = dom.window.document.querySelector('title').textContent;
      expect(title).toBe('Stigmergy Dashboard');
    });

    it('should include the correct Content-Security-Policy header', async () => {
      const response = await axios.get(baseURL);
      const cspHeader = response.headers['content-security-policy'];
      const expectedCsp = "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws:;";

      expect(cspHeader).toBe(expectedCsp);
    });
  });
});
