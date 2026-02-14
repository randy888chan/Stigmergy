import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Engine } from "../../engine/server.js";

// This test can now start its own engine on port 0 to avoid EADDRINUSE
describe("Pre-Flight Dry Run", () => {
    let engine;
    let BASE_URL = "http://localhost:3010";

    beforeAll(async () => {
        try {
            // Try to connect to existing server first
            const response = await fetch(`${BASE_URL}/health`);
            if (response.ok) {
                console.log("Using existing server on port 3010");
                return;
            }
        } catch (e) {
            // No server on 3010, start our own on port 0
            console.log("No server on 3010, starting temporary engine on port 0...");
            engine = new Engine({ port: 0 });
            await engine.stateManagerInitializationPromise;
            await engine.start();
            BASE_URL = `http://localhost:${engine.port}`;
        }
    });

    afterAll(async () => {
        if (engine) {
            await engine.stop();
        }
    });

    test("Server should be reachable (Health Check)", async () => {
        try {
            const response = await fetch(`${BASE_URL}/health`);
            const data = await response.json();
            console.log("Health Check Response:", data);
            expect(response.status).toBe(200);
            expect(data.status).toBe("ok");
        } catch (e) {
            throw new Error(`Server is NOT reachable at ${BASE_URL}. Error: ${e.message}`);
        }
    });

    test("Files API should return list (Read-Only Check)", async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/files`);
            expect(response.status).toBe(200);
            const files = await response.json();
            console.log(`Found ${files.length} files in project root.`);
            expect(Array.isArray(files)).toBe(true);
        } catch (e) {
            console.warn(`Files API check failed, might be expected if server logic differs: ${e.message}`);
            throw e;
        }
    });
});
