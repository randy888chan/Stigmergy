import GraphStateManager from '../../../../src/infrastructure/state/GraphStateManager.js';
import neo4j from 'neo4j-driver';
import config from '../../../../stigmergy.config.js';

// Mock the entire neo4j-driver module
jest.mock('neo4j-driver');

// Mock the config module
jest.mock('../../../../stigmergy.config.js', () => ({
  features: {
    neo4j: 'auto', // Default mock value
  },
}));

describe('GraphStateManager', () => {
  let mockSession;
  let originalEnv;

  beforeEach(() => {
    // Setup mock for the neo4j session and driver
    mockSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const mockDriver = {
      session: jest.fn(() => mockSession),
      close: jest.fn(),
    };
    neo4j.driver.mockReturnValue(mockDriver);

    // Backup original process.env and set mock env
    originalEnv = { ...process.env };
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'user';
    process.env.NEO4J_PASSWORD = 'password';
    
    // Reset the singleton's state for each test
    GraphStateManager.driver = null;
    GraphStateManager.connectionStatus = 'UNINITIALIZED';
    GraphStateManager.initializeDriver(); // Manually initialize
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv; // Restore original process.env
  });

  describe('getState', () => {
    it('should return the default state if project does not exist', async () => {
      mockSession.run.mockResolvedValue({ records: [] });
      const state = await GraphStateManager.getState('non-existent-project');
      expect(state.project_name).toBe('non-existent-project');
      expect(state.project_status).toBe('NEEDS_INITIALIZATION');
    });

    it('should return the project state from the database if it exists', async () => {
      const mockProject = {
        name: 'existing-project',
        project_status: 'IN_PROGRESS',
        project_manifest: JSON.stringify({ tasks: [{ id: 1, name: 'Test Task' }] }),
      };
      mockSession.run.mockResolvedValue({
        records: [{ get: () => ({ properties: mockProject }) }],
      });

      const state = await GraphStateManager.getState('existing-project');
      expect(state.project_status).toBe('IN_PROGRESS');
      expect(state.project_manifest.tasks).toHaveLength(1);
    });
  });

  describe('updateState', () => {
    it('should run a MERGE query with the correct properties', async () => {
      const event = {
        type: 'STATUS_UPDATED',
        project_name: 'test-project',
        project_status: 'EXECUTION_PHASE',
        project_manifest: { tasks: ['new task'] },
      };
      
      // Mock getState to be called within updateState
      mockSession.run.mockResolvedValueOnce({ records: [] }); // For the update MERGE
      mockSession.run.mockResolvedValueOnce({ // For the subsequent getState call
        records: [{ get: () => ({ properties: { name: 'test-project', project_status: 'EXECUTION_PHASE' } }) }],
      });

      await GraphStateManager.updateState(event);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (p:Project {name: $projectName})'),
        expect.objectContaining({
          projectName: 'test-project',
          properties: expect.objectContaining({
            project_status: 'EXECUTION_PHASE',
            project_manifest: JSON.stringify({ tasks: ['new task'] }, null, 2),
          }),
        })
      );
    });

    it('should emit a stateChanged event on successful update', async () => {
        const mockCallback = jest.fn();
        GraphStateManager.subscribeToChanges(mockCallback);

        const event = { type: 'TEST_EVENT', project_name: 'test-project' };
        
        // Mock the return for getState inside updateState
        mockSession.run.mockResolvedValue({
            records: [{ get: () => ({ properties: { name: 'test-project', project_status: 'UPDATED' } }) }],
        });

        await GraphStateManager.updateState(event);

        expect(mockCallback).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
            project_status: 'UPDATED',
        }));
    });
  });
});
