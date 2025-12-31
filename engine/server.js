import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";

export class Engine {
  constructor(options = {}) {
    this.config = options.config || {};
    this.app = new Hono();
    this.port = Number(process.env.STIGMERGY_PORT) || 3010;

    this.app.use("*", cors());

    // Health Check
    this.app.get("/health", (c) => c.json({ status: "ok", mode: "production_fixed" }));

    // API routes (can be added here later)
    this.app.get("/api/test", (c) => c.json({ message: "API is working" }));

    // --- Static File Serving ---
    // Serve all assets from the 'dashboard/public' directory
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));

    // Serve the 'index.html' file for any route that is not an asset or API call
    // This is crucial for single-page applications (SPAs) like React.
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  async start() {
    console.log(`Starting production-ready server on port ${this.port}...`);
    serve({
      fetch: this.app.fetch,
      port: this.port
    });
    console.log(`Server listening at http://localhost:${this.port}`);
    console.log(`Dashboard should be available at http://localhost:${this.port}/`);
  }
}
