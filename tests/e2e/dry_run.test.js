import { describe, test, expect } from "bun:test";

// This test assumes the server is ALREADY running via Docker.
// It acts as an external client probe.
describe("Pre-Flight Dry Run", () => {
    const BASE_URL = "http://localhost:3010";

    test("Server should be reachable (Health Check)", async () => {
        try {
            const response = await fetch(`${BASE_URL}/health`);
            const data = await response.json();
            console.log("Health Check Response:", data);
            expect(response.status).toBe(200);
            expect(data.status).toBe("ok");
        } catch (e) {
            throw new Error(`Server is NOT reachable at ${BASE_URL}. Is Docker running? Error: ${e.message}`);
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
            // We don't necessarily fail here if the API is not exactly as expected,
            // but the prompt said it should return a list.
            throw e;
        }
    });
});
