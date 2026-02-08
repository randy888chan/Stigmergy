import { describe, it, expect, spyOn } from "bun:test";
import { HttpStorageAdapter } from "../../engine/infrastructure/state/HttpStorageAdapter.js";

const TEST_ORG_ID = "test-org";
const TEST_PROJ_ID = "test-proj";
const BASE_URL = "http://localhost:3012";
const API_URL = `${BASE_URL}/api/state/${TEST_ORG_ID}/${TEST_PROJ_ID}`;

describe("HttpStorageAdapter", () => {
  // REMOVED beforeEach and afterEach to handle spies locally within each test,
  // preventing any potential for cross-test pollution.

  it("should fetch state from the server", async () => {
    // Spy is created and restored within the scope of this single test.
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async (url, options) => {
      return new Response(JSON.stringify({ project_status: "mock_status" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const adapter = new HttpStorageAdapter(BASE_URL, TEST_ORG_ID, TEST_PROJ_ID);
    const state = await adapter.getState();

    expect(state).toEqual({ project_status: "mock_status" });
    expect(fetchSpy).toHaveBeenCalledWith(API_URL);

    fetchSpy.mockRestore(); // Clean up immediately.
  });

  it("should update state on the server", async () => {
    // Spy is created and restored within the scope of this single test.
    const fetchSpy = spyOn(global, "fetch").mockImplementation(async (url, options) => {
      return new Response(null, { status: 200 });
    });

    const adapter = new HttpStorageAdapter(BASE_URL, TEST_ORG_ID, TEST_PROJ_ID);
    const newState = { project_status: "updated_status" };
    await adapter.updateState(newState);

    expect(fetchSpy).toHaveBeenCalledWith(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newState),
    });

    fetchSpy.mockRestore(); // Clean up immediately.
  });
});
