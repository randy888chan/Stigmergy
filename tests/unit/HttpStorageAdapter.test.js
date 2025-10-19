import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HttpStorageAdapter } from '/app/src/infrastructure/state/HttpStorageAdapter.js';

// Mock fetch before each test
beforeEach(() => {
  global.fetch = mock(async (url, options) => {
    if (url.toString().endsWith('/api/state') && (!options || options.method === 'GET')) {
      return new Response(JSON.stringify({ project_status: 'mock_status' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.toString().endsWith('/api/state') && options.method === 'POST') {
      return new Response(null, { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  });
});

describe('HttpStorageAdapter', () => {
  it('should fetch state from the server', async () => {
    const adapter = new HttpStorageAdapter();
    const state = await adapter.getState();
    expect(state).toEqual({ project_status: 'mock_status' });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3012/api/state');
  });

  it('should update state on the server', async () => {
    const adapter = new HttpStorageAdapter();
    const newState = { project_status: 'updated_status' };
    await adapter.updateState(newState);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3012/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState),
    });
  });
});
