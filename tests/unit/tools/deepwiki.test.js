import fs from 'fs-extra';
import path from 'path';

// Mock fs and other dependencies
jest.mock('fs-extra');

describe('DeepWiki Tool Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('deepwiki.query', () => {
    it('should be available in the toolbelt', async () => {
      // Mock the manifest file
      const mockManifest = `
\`\`\`yaml
agents:
  - id: "test-agent"
    name: "Test Agent"
    engine_tools:
      - "deepwiki.*"
\`\`\`
`;
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('test-agent.md')) {
          return Promise.resolve(`\`\`\`yaml
agent:
  id: "test-agent"
  name: "Test Agent"
  engine_tools:
    - "deepwiki.*"
\`\`\``);
        }
        return Promise.resolve(mockManifest);
      });

      // Mock the core path
      const originalEnv = process.env.STIGMERGY_CORE_PATH;
      process.env.STIGMERGY_CORE_PATH = path.join(__dirname, '../../fixtures/test-core');

      // Import the tool executor
      const { createExecutor } = await import('../../../engine/tool_executor.js');
      const mockEngine = {
        getAgent: jest.fn().mockReturnValue({ id: 'test-agent' }),
        triggerAgent: jest.fn().mockResolvedValue('task result')
      };
      const executor = createExecutor(mockEngine);

      // Mock the deepwiki service
      jest.mock('../../../services/deepwiki_mcp.js', () => {
        return {
          query_deepwiki: jest.fn().mockResolvedValue({ result: 'test' })
        };
      });

      // Execute the tool
      const result = await executor('deepwiki.query', { 
        repository: 'owner/repo', 
        question: 'test question' 
      }, 'test-agent');

      // Restore environment
      process.env.STIGMERGY_CORE_PATH = originalEnv;

      expect(result).toContain('test');
    }, 10000);

    it('should reject unauthorized agents', async () => {
      // Mock the agent file
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('unauthorized-agent.md')) {
          return Promise.resolve(`\`\`\`yaml
agent:
  id: "unauthorized-agent"
  name: "Unauthorized Agent"
  engine_tools:
    - "file_system.read"
\`\`\``);
        }
        throw new Error('File not found');
      });

      // Mock the core path
      const originalEnv = process.env.STIGMERGY_CORE_PATH;
      process.env.STIGMERGY_CORE_PATH = path.join(__dirname, '../../fixtures/test-core');

      // Import the tool executor
      const { createExecutor } = await import('../../../engine/tool_executor.js');
      const mockEngine = {
        getAgent: jest.fn().mockReturnValue({ id: 'unauthorized-agent' })
      };
      const executor = createExecutor(mockEngine);

      // Try to execute the tool
      await expect(executor('deepwiki.query', { 
        repository: 'owner/repo', 
        question: 'test question' 
      }, 'unauthorized-agent')).rejects.toThrow('not permitted');

      // Restore environment
      process.env.STIGMERGY_CORE_PATH = originalEnv;
    }, 10000);
  });
});