import { DeepWikiMCP } from '../../../services/deepwiki_mcp.js';

describe('DeepWiki MCP Integration', () => {
  describe('listTools', () => {
    it('should include DeepWiki tools in the MCP server tool list', async () => {
      // Import the MCP server
      const mcpServer = await import('../../../mcp-server.js');
      
      // Get the list of tools
      const tools = await mcpServer.default.listTools();
      
      // Check that DeepWiki tools are included
      const deepwikiTools = tools.filter(tool => 
        tool.name.startsWith('deepwiki_')
      );
      
      expect(deepwikiTools).toHaveLength(3);
      expect(deepwikiTools.map(t => t.name)).toEqual([
        'deepwiki_query',
        'deepwiki_structure',
        'deepwiki_contents'
      ]);
    });
  });

  describe('callTool', () => {
    it('should handle deepwiki_query tool calls', async () => {
      // Import the MCP server
      const mcpServer = await import('../../../mcp-server.js');
      
      // Mock the query_deepwiki function
      jest.mock('../../../services/deepwiki_mcp.js', () => {
        return {
          query_deepwiki: jest.fn().mockResolvedValue({ result: 'test' }),
          DeepWikiMCP: jest.requireActual('../../../services/deepwiki_mcp.js').DeepWikiMCP
        };
      });
      
      // Call the tool
      const result = await mcpServer.default.callTool('deepwiki_query', {
        repository: 'owner/repo',
        question: 'test question'
      });
      
      expect(result).toEqual({ result: 'test' });
    });

    it('should handle deepwiki_structure tool calls', async () => {
      // Import the MCP server
      const mcpServer = await import('../../../mcp-server.js');
      
      // Mock the DeepWikiMCP class
      const mockStructure = { files: ['README.md'] };
      jest.mock('../../../services/deepwiki_mcp.js', () => {
        return {
          query_deepwiki: jest.requireActual('../../../services/deepwiki_mcp.js').query_deepwiki,
          DeepWikiMCP: jest.fn().mockImplementation(() => {
            return {
              readWikiStructure: jest.fn().mockResolvedValue(mockStructure)
            };
          })
        };
      });
      
      // Call the tool
      const result = await mcpServer.default.callTool('deepwiki_structure', {
        repository: 'owner/repo'
      });
      
      expect(result).toEqual(mockStructure);
    });

    it('should handle deepwiki_contents tool calls', async () => {
      // Import the MCP server
      const mcpServer = await import('../../../mcp-server.js');
      
      // Mock the DeepWikiMCP class
      const mockContents = { content: 'test content' };
      jest.mock('../../../services/deepwiki_mcp.js', () => {
        return {
          query_deepwiki: jest.requireActual('../../../services/deepwiki_mcp.js').query_deepwiki,
          DeepWikiMCP: jest.fn().mockImplementation(() => {
            return {
              readWikiContents: jest.fn().mockResolvedValue(mockContents)
            };
          })
        };
      });
      
      // Call the tool
      const result = await mcpServer.default.callTool('deepwiki_contents', {
        repository: 'owner/repo',
        path: 'README.md'
      });
      
      expect(result).toEqual(mockContents);
    });
  });
});