import { Engine } from '../../engine/server.js';
import { CodeIntelligenceService } from '../../services/code_intelligence_service.js';
import * as archon from '../../tools/archon_tool.js';
import { exec } from 'child_process';

// Mock the dependencies
jest.mock('../../services/code_intelligence_service.js');
jest.mock('../../tools/archon_tool.js');
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('Engine Startup Connectivity Audit', () => {
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should show all services as connected', async () => {
    // Arrange
    CodeIntelligenceService.prototype.testConnection.mockResolvedValue({
      status: 'ok',
      message: 'Connected to Neo4j.',
    });
    archon.healthCheck.mockResolvedValue({
      status: 'ok',
      message: 'Connected to Archon server.',
    });
    exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'Gemini CLI 1.0.0' });
    });


    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[✔] Neo4j: Connected to Neo4j.');
    expect(output).toContain('[✔] Archon Power Mode: Connected to Archon server.');
    expect(output).toContain('[✔] Gemini CLI: Gemini CLI is installed and accessible.');
  });

  it('should show Archon as disconnected', async () => {
    // Arrange
    CodeIntelligenceService.prototype.testConnection.mockResolvedValue({
      status: 'ok',
      message: 'Connected to Neo4j.',
    });
    archon.healthCheck.mockResolvedValue({
      status: 'not_found',
      message: 'Archon server not found.',
    });
    exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'Gemini CLI 1.0.0' });
    });

    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[✔] Neo4j: Connected to Neo4j.');
    expect(output).toContain('[!] Archon Power Mode: Archon server not found.');
    expect(output).toContain('[✔] Gemini CLI: Gemini CLI is installed and accessible.');
  });

  it('should show Neo4j as disconnected and Gemini as not found', async () => {
    // Arrange
    CodeIntelligenceService.prototype.testConnection.mockResolvedValue({
      status: 'error',
      message: 'Neo4j connection failed.',
    });
    archon.healthCheck.mockResolvedValue({
        status: 'ok',
        message: 'Connected to Archon server.',
      });
    exec.mockImplementation((command, callback) => {
        callback(new Error('Command not found'), null);
    });

    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[✖] Neo4j: Neo4j connection failed.');
    expect(output).toContain('[✔] Archon Power Mode: Connected to Archon server.');
    expect(output).toContain('[!] Gemini CLI: Gemini CLI not found.');
  });

  it('should have created a backup of .stigmergy-core', async () => {
    // This test relies on the `pretest` script having been run.
    // It checks if a backup file was created in the last few minutes.
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(process.env.HOME, ".stigmergy-backups");

    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.tar.gz'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    expect(backups.length).toBeGreaterThan(0);

    const latestBackup = backups[0];
    const fiveMinutes = 5 * 60 * 1000;
    const isRecent = (new Date().getTime() - latestBackup.time) < fiveMinutes;

    expect(isRecent).toBe(true);
  });
});
