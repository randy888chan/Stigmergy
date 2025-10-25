import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HttpStorageAdapter } from '/app/src/infrastructure/state/HttpStorageAdapter.js';

const TEST_ORG_ID = 'test-org';
const TEST_PROJ_ID = 'test-proj';
const BASE_URL = 'http://localhost:3012';
const API_URL = `${BASE_URL}/api/state/${TEST_ORG_ID}/${TEST_PROJ_ID}`;

// Mock fetch before each test
beforeEach(() => {
  global.fetch = mock(async (url, options) => {
    const urlString = url.toString();

    if (urlString === API_URL && (!options || options.method === 'GET')) {
      return new Response(JSON.stringify({ project_status: 'mock_status' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (urlString === API_URL && options.method === 'POST') {
      return new Response(null, { status: 200 });
    }
    // Handle the old, incorrect URL to provide a better error message if the code regresses
    if (urlString.endsWith('/api/state')) {
         return new Response('Bad Request: Missing organizationId and projectId in URL', { status: 400 });
    }
    return new Response('Not Found', { status: 404 });
  });
});

describe('HttpStorageAdapter', () => {
  it('should fetch state from the server', async () => {
    const adapter = new HttpStorageAdapter(BASE_URL, TEST_ORG_ID, TEST_PROJ_ID);
    const state = await adapter.getState();
    expect(state).toEqual({ project_status: 'mock_status' });
    expect(global.fetch).toHaveBeenCalledWith(API_URL);
  });

  it('should update state on the server', async () => {
    const adapter = new HttpStorageAdapter(BASE_URL, TEST_ORG_ID, TEST_PROJ_ID);
    const newState = { project_status: 'updated_status' };
    await adapter.updateState(newState);
    expect(global.fetch).toHaveBeenCalledWith(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState),
    });
  });
});
