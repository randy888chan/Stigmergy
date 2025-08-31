import GraphStateManager from '../../../../src/infrastructure/state/GraphStateManager.js';
import neo4j from 'neo4j-driver';
import config from '../../../../stigmergy.config.js';

// Mock dependencies
jest.mock('neo4j-driver');
jest.mock('../../../../stigmergy.config.js', () => ({
  features: {
    neo4j: 'optional', // Default mock value
  },
}));

describe('GraphStateManager', () => {
  let originalEnv;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Backup original process.env
    originalEnv = { ...process.env };
    // Reset the singleton's state for each test
    GraphStateManager.driver = null;
    GraphStateManager.connectionStatus = 'UNINITIALIZED';
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('initializeDriver', () => {
    it('should initialize the driver and set status to INITIALIZED when URI is provided', () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USER = 'user';
      process.env.NEO4J_PASSWORD = 'password';

      const mockDriver = { close: jest.fn() };
      neo4j.driver.mockReturnValue(mockDriver);

      GraphStateManager.initializeDriver();

      expect(neo4j.driver).toHaveBeenCalledWith(
        'bolt://localhost:7687',
        neo4j.auth.basic('user', 'password')
      );
      expect(GraphStateManager.driver).toBe(mockDriver);
      expect(GraphStateManager.connectionStatus).toBe('INITIALIZED');
    });

    it('should set status to FAILED_INITIALIZATION when driver creation throws an error', () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      const error = new Error('Connection failed');
      neo4j.driver.mockImplementation(() => {
        throw error;
      });

      GraphStateManager.initializeDriver();

      expect(GraphStateManager.driver).toBeNull();
      expect(GraphStateManager.connectionStatus).toBe('FAILED_INITIALIZATION');
    });

    it('should set status to REQUIRED_MISSING when URI is missing and feature is required', () => {
      delete process.env.NEO4J_URI;
      config.features.neo4j = 'required';

      GraphStateManager.initializeDriver();

      expect(GraphStateManager.driver).toBeNull();
      expect(GraphStateManager.connectionStatus).toBe('REQUIRED_MISSING');
    });

    it('should do nothing when URI is missing and feature is not required', () => {
        delete process.env.NEO4J_URI;
        config.features.neo4j = 'optional'; // Default, but being explicit
  
        GraphStateManager.initializeDriver();
  
        expect(GraphStateManager.driver).toBeNull();
        expect(GraphStateManager.connectionStatus).toBe('UNINITIALIZED'); // Status should not change
      });
  });

  describe('getState', () => {
    it('should return a default state object', async () => {
      const state = await GraphStateManager.getState('test-project');
      expect(state).toEqual({
        project_name: 'test-project',
        project_status: 'NEEDS_INITIALIZATION',
        project_manifest: { tasks: [] },
        history: [],
      });
    });
  });

  describe('updateState', () => {
    it('should call console.log and return the current state', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const event = { type: 'TEST_EVENT', project_name: 'test-project' };
        
        const state = await GraphStateManager.updateState(event);
        
        expect(consoleSpy).toHaveBeenCalledWith('[GraphStateManager] Mock updateState called with event:', 'TEST_EVENT');
        expect(state.project_name).toBe('test-project');

        consoleSpy.mockRestore();
    });
  });

  describe('subscribeToChanges', () => {
    it('should register and trigger a callback on stateChanged event', () => {
      const mockCallback = jest.fn();
      const payload = { data: 'test' };

      GraphStateManager.subscribeToChanges(mockCallback);
      GraphStateManager.emit('stateChanged', payload);

      expect(mockCallback).toHaveBeenCalledWith(payload);
    });
  });
});
