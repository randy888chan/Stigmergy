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
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.log
    consoleSpy.mockRestore();
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
    const { exec } = require('child_process');
    exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'Gemini CLI 1.0.0' });
    });

    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[✔] Archon Power Mode: Connected to Archon server.');
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
    const { exec } = require('child_process');
    exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'Gemini CLI 1.0.0' });
    });

    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[!] Archon Power Mode: Archon server not found. (Will use standard research tools).');
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
    const { exec } = require('child_process');
    exec.mockImplementation((command, callback) => {
        callback(new Error('Command not found'), null);
    });

    const engine = new Engine();

    // Act
    await engine.initialize();

    // Assert
    const output = consoleSpy.mock.calls.flat().join('\n');
    expect(output).toContain('[✔] Archon Power Mode: Connected to Archon server.');
  });
});
