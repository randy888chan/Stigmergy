import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs/promises';

// This function now creates and configures a Hono app specifically for the dashboard UI.
export function createDashboardApp(projectRoot) {
  const dashboardApp = new Hono();
  const publicPath = path.join(projectRoot, 'dashboard', 'public');
  const indexPath = path.join(publicPath, 'index.html');

  // This middleware will try to serve a file. If not found, it calls next().
  dashboardApp.use('*', serveStatic({ root: publicPath }));

  // Fallback route: For any GET request that wasn't a static file, serve the SPA.
  dashboardApp.get('*', async (c) => {
    try {
      const indexHtml = await fs.readFile(indexPath, 'utf-8');
      return c.html(indexHtml);
    } catch (error) {
      console.error('Failed to read index.html:', error);
      return c.text('Application not found.', 404);
    }
  });

  return dashboardApp;
}