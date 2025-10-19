import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';
import { FileStorageAdapter } from '../../src/infrastructure/state/FileStorageAdapter.js';

const app = new Hono();
const port = 3012;

// Use the project root of the team-server package for state storage
const projectRoot = process.cwd();
const storageAdapter = new FileStorageAdapter();
const stateManager = new GraphStateManager(projectRoot, storageAdapter);

app.get('/api/state', async (c) => {
  const state = await stateManager.getState();
  return c.json(state);
});

app.post('/api/state', async (c) => {
  const body = await c.req.json();
  const newState = await stateManager.updateState(body);
  return c.json(newState);
});

console.log(`Team server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
