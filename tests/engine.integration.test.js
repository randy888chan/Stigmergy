const request = require('supertest');
const fs = require('fs-extra');
const path = require('path');
const { _appForTesting: app, stopEngineLoop, mainEngineLoop } = require('../engine/server');
const STATE_FILE = path.resolve(process.cwd(), '.ai', 'state.json');

// Mute console logs during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Engine Integration Test', () => {
  beforeEach(async () => {
    await fs.remove(path.dirname(STATE_FILE));
    await stopEngineLoop('Test Setup'); // Ensure loop is stopped
  });

  afterAll(async () => {
    await fs.remove(path.dirname(STATE_FILE));
    jest.restoreAllMocks(); // Restore console
  });

  it('should initialize a project, pause it durably across a simulated restart, and resume it', async () => {
    // Step 1: Start the project
    await request(app)
      .post('/api/system/start')
      .send({ goal: 'Test durable pause' })
      .expect(200);

    let state = await fs.readJson(STATE_FILE);
    expect(state.project_status).toBe('GRAND_BLUEPRINT_PHASE');

    // Step 2: Pause the project
    await request(app).post('/api/control/pause').send().expect(200);

    state = await fs.readJson(STATE_FILE);
    expect(state.project_status).toBe('PAUSED_BY_USER');
    expect(state.status_before_pause).toBe('GRAND_BLUEPRINT_PHASE');

    // Step 3: Resume the project
    await request(app).post('/api/control/resume').send().expect(200);

    state = await fs.readJson(STATE_FILE);
    expect(state.project_status).toBe('GRAND_BLUEPRINT_PHASE');
    expect(state.status_before_pause).toBeNull();
  });
});
