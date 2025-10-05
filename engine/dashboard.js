import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'fs/promises'
import path from 'path';

export function createDashboardApp(projectRoot = process.cwd()) {
  const dashboardApp = new Hono();
  const publicPath = path.join(projectRoot, 'dashboard', 'public');

  // 1. API routes come first
  dashboardApp.get('/api/state', async (c) => {
    const stateManager = c.get('stateManager');
    if (stateManager) {
      const state = await stateManager.getState();
      return c.json(state);
    }
    return c.json({ error: 'StateManager not available' });
  });

  // 2. Serve static assets from the root
  dashboardApp.use('/*', serveStatic({ root: publicPath }));

  // 3. SPA fallback using notFound
  // This is the most robust way to handle SPAs in Hono.
  // It ensures that any request that doesn't match a static file falls back to index.html.
  dashboardApp.notFound(async (c) => {
    try {
      const indexHtmlPath = path.join(publicPath, 'index.html');
      const content = await readFile(indexHtmlPath, 'utf-8');
      return c.html(content, 200);
    } catch (error) {
      console.error(`[Dashboard] Could not serve index.html: ${error.message}`);
      return c.text('Not Found', 404);
    }
  });

  return dashboardApp;
}