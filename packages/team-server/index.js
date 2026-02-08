import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { GraphStateManager } from '../../services/GraphStateManager.js';
import { FileStorageAdapter } from '../../services/FileStorageAdapter.js';
import path from 'path';
import fs from 'fs-extra';

const app = new Hono();
const port = 3012;

const baseStatePath = path.join(process.cwd(), 'stigmergy-state');

// Helper function to get a state manager for a specific context
const getStateManager = async (organizationId, projectId) => {
  const projectRoot = path.join(baseStatePath, organizationId, projectId);
  await fs.ensureDir(projectRoot); // Ensure the directory exists
  const storageAdapter = new FileStorageAdapter();
  return new GraphStateManager(projectRoot, storageAdapter);
};

app.get('/api/state/:organizationId/:projectId', async (c) => {
  const { organizationId, projectId } = c.req.param();
  const stateManager = await getStateManager(organizationId, projectId);
  const state = await stateManager.getState();
  return c.json(state);
});

app.post('/api/state/:organizationId/:projectId', async (c) => {
  const { organizationId, projectId } = c.req.param();
  const stateManager = await getStateManager(organizationId, projectId);
  const body = await c.req.json();
  const newState = await stateManager.updateState(body);
  return c.json(newState);
});

// Add a health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }));

console.log(`Team server running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
