import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { createRemoteScannerTools, handleRemoteScannerTool } from '../../src/coderag/mcp/tools/remote-scanner-tools.js';
import { Neo4jClient } from '../../src/coderag/graph/neo4j-client.js';
import { CodebaseScanner } from '../../src/coderag/scanner/codebase-scanner.js';

// Mock the entire modules
mock.module('../../src/coderag/graph/neo4j-client.js', () => ({
  Neo4jClient: mock(),
}));
mock.module('../../src/coderag/scanner/codebase-scanner.js', () => ({
  CodebaseScanner: mock(),
}));


describe('Remote Scanner Tools', () => {
  let mockClient: Neo4jClient;
  let mockScanner: any; // Use 'any' for the mocked instance

  beforeEach(() => {
    // Re-import the mocked classes for each test to get fresh mocks
    const { Neo4jClient: MockNeo4jClient } = require('../../src/coderag/graph/neo4j-client.js');
    const { CodebaseScanner: MockCodebaseScanner } = require('../../src/coderag/scanner/codebase-scanner.js');

    // Reset mocks
    MockNeo4jClient.mockClear();
    MockCodebaseScanner.mockClear();

    mockClient = new MockNeo4jClient({
      uri: 'bolt://localhost:7687',
      user: 'neo4j',
      password: 'test'
    });

    // Create a mock instance for the scanner
    mockScanner = {
      scanRemoteRepository: mock(),
      validateRemoteRepository: mock(),
      parseGitUrl: mock(),
      clearGraph: mock(),
      clearCache: mock(),
      getCacheStats: mock(),
      gitManager: {
        validateRepository: mock()
      }
    };

    // Make the constructor return our mock instance
    MockCodebaseScanner.mockImplementation(() => mockScanner);
  });

  describe('createRemoteScannerTools', () => {
    it('should return array of remote scanner tools', () => {
      const tools = createRemoteScannerTools(mockClient);

      expect(tools).toHaveLength(4);

      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('scan_remote_repo');
      expect(toolNames).toContain('validate_remote_repo');
      expect(toolNames).toContain('git_cache_stats');
      expect(toolNames).toContain('clear_git_cache');
    });

    it('should have proper schema for scan_remote_repo tool', () => {
      const tools = createRemoteScannerTools(mockClient);
      const scanTool = tools.find(tool => tool.name === 'scan_remote_repo');

      expect(scanTool).toBeDefined();
      expect(scanTool?.description).toContain('remote Git repository');
      expect(scanTool?.inputSchema.required).toContain('gitUrl');
    });
  });

  describe('handleRemoteScannerTool', () => {
    describe('scan_remote_repo', () => {
      it('should handle successful repository scanning', async () => {
        const mockScanResult = {
          stats: {
            filesProcessed: 10,
            entitiesFound: 50,
            relationshipsFound: 25,
            processingTimeMs: 1000
          },
          errors: []
        };

        mockScanner.parseGitUrl.mockReturnValue({
          protocol: 'https',
          provider: 'github',
          host: 'github.com',
          owner: 'test-owner',
          repo: 'test-repo',
          originalUrl: 'https://github.com/test-owner/test-repo.git'
        });

        mockScanner.scanRemoteRepository.mockResolvedValue(mockScanResult);

        const result = await handleRemoteScannerTool('scan_remote_repo', {
          gitUrl: 'https://github.com/test-owner/test-repo.git'
        }, mockClient);

        expect(result.success).toBe(true);
        expect(result.projectId).toBe('test-owner-test-repo');
        expect(result.scanResults.filesProcessed).toBe(10);
        expect(result.scanResults.entitiesFound).toBe(50);
        expect(mockScanner.scanRemoteRepository).toHaveBeenCalledWith(
          'https://github.com/test-owner/test-repo.git',
          expect.objectContaining({
            projectId: 'test-owner-test-repo',
            languages: ['typescript', 'javascript', 'java', 'python'],
            includeTests: false,
            outputProgress: true
          })
        );
      });

      it('should handle custom project ID', async () => {
        const mockScanResult = {
          stats: { filesProcessed: 5, entitiesFound: 20, relationshipsFound: 10, processingTimeMs: 500 },
          errors: []
        };

        mockScanner.parseGitUrl.mockReturnValue({
          protocol: 'https',
          provider: 'github',
          host: 'github.com',
          owner: 'test-owner',
          repo: 'test-repo',
          originalUrl: 'https://github.com/test-owner/test-repo.git'
        });

        mockScanner.scanRemoteRepository.mockResolvedValue(mockScanResult);

        const result = await handleRemoteScannerTool('scan_remote_repo', {
          gitUrl: 'https://github.com/test-owner/test-repo.git',
          projectId: 'custom-project-id'
        }, mockClient);

        expect(result.projectId).toBe('custom-project-id');
        expect(mockScanner.scanRemoteRepository).toHaveBeenCalledWith(
          'https://github.com/test-owner/test-repo.git',
          expect.objectContaining({
            projectId: 'custom-project-id'
          })
        );
      });

      it('should clear graph when requested', async () => {
        const mockScanResult = {
          stats: { filesProcessed: 1, entitiesFound: 5, relationshipsFound: 2, processingTimeMs: 100 },
          errors: []
        };

        mockScanner.parseGitUrl.mockReturnValue({
          protocol: 'https',
          provider: 'github',
          host: 'github.com',
          owner: 'test-owner',
          repo: 'test-repo',
          originalUrl: 'https://github.com/test-owner/test-repo.git'
        });

        mockScanner.scanRemoteRepository.mockResolvedValue(mockScanResult);

        await handleRemoteScannerTool('scan_remote_repo', {
          gitUrl: 'https://github.com/test-owner/test-repo.git',
          clearGraph: true
        }, mockClient);

        expect(mockScanner.clearGraph).toHaveBeenCalledWith('test-owner-test-repo');
      });
    });

    describe('validate_remote_repo', () => {
      it('should validate accessible repository', async () => {
        const mockRepoInfo = {
          name: 'test-repo',
          fullName: 'test-owner/test-repo',
          url: 'https://github.com/test-owner/test-repo.git',
          branch: 'main'
        };

        mockScanner.validateRemoteRepository.mockResolvedValue(true);
        mockScanner.gitManager.validateRepository.mockResolvedValue(mockRepoInfo);

        const result = await handleRemoteScannerTool('validate_remote_repo', {
          gitUrl: 'https://github.com/test-owner/test-repo.git'
        }, mockClient);

        expect(result.valid).toBe(true);
        expect(result.repository).toEqual(mockRepoInfo);
        expect(mockScanner.validateRemoteRepository).toHaveBeenCalledWith(
          'https://github.com/test-owner/test-repo.git'
        );
      });

      it('should handle inaccessible repository', async () => {
        mockScanner.validateRemoteRepository.mockResolvedValue(false);

        const result = await handleRemoteScannerTool('validate_remote_repo', {
          gitUrl: 'https://github.com/invalid/repo.git'
        }, mockClient);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Repository validation failed');
      });

      it('should handle validation errors', async () => {
        mockScanner.validateRemoteRepository.mockRejectedValue(new Error('Network error'));

        const result = await handleRemoteScannerTool('validate_remote_repo', {
          gitUrl: 'https://github.com/test-owner/test-repo.git'
        }, mockClient);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Network error');
      });
    });

    describe('git_cache_stats', () => {
      it('should return cache statistics', async () => {
        const mockStats = {
          entries: 3,
          totalSize: 1024 * 1024, // 1MB
          oldestEntry: new Date('2024-01-01'),
          newestEntry: new Date('2024-01-02')
        };

        mockScanner.getCacheStats.mockResolvedValue(mockStats);

        const result = await handleRemoteScannerTool('git_cache_stats', {}, mockClient);

        expect(result.cache.entries).toBe(3);
        expect(result.cache.totalSizeBytes).toBe(1024 * 1024);
        expect(result.cache.totalSizeMB).toBe(1);
        expect(result.cache.oldestEntry).toBe('2024-01-01T00:00:00.000Z');
        expect(result.cache.newestEntry).toBe('2024-01-02T00:00:00.000Z');
      });
    });

    describe('clear_git_cache', () => {
      it('should clear cache and return statistics', async () => {
        const mockStatsBefore = {
          entries: 5,
          totalSize: 2 * 1024 * 1024 // 2MB
        };

        mockScanner.getCacheStats.mockResolvedValue(mockStatsBefore);
        mockScanner.clearCache.mockResolvedValue(undefined);

        const result = await handleRemoteScannerTool('clear_git_cache', {}, mockClient);

        expect(result.success).toBe(true);
        expect(result.clearedEntries).toBe(5);
        expect(result.freedSpaceBytes).toBe(2 * 1024 * 1024);
        expect(result.freedSpaceMB).toBe(2);
        expect(mockScanner.clearCache).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should throw error for unknown tool', async () => {
        await expect(
          handleRemoteScannerTool('unknown_tool', {}, mockClient)
        ).rejects.toThrow('Unknown remote scanner tool: unknown_tool');
      });
    });
  });
});