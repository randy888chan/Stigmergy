import { LightweightArchon, lightweight_archon_query } from '../../../services/lightweight_archon.js';
import { DeepWikiMCP } from '../../../services/deepwiki_mcp.js';

// Mock the dependencies
jest.mock('../../../services/coderag_integration.js');
jest.mock('../../../tools/research.js');
jest.mock('../../../services/deepwiki_mcp.js');

import { CodeRAGIntegration } from '../../../services/coderag_integration.js';
import * as research from '../../../tools/research.js';

describe('LightweightArchon', () => {
  let archon;
  
  beforeEach(() => {
    archon = new LightweightArchon();
  });

  describe('extractGithubRepo', () => {
    it('should extract GitHub repository from full URL', () => {
      const result = archon.extractGithubRepo('How do I use github.com/owner/repo?');
      expect(result).toBe('owner/repo');
    });

    it('should extract GitHub repository from short format', () => {
      const result = archon.extractGithubRepo('How do I use owner/repo?');
      expect(result).toBe('owner/repo');
    });

    it('should return null when no repository is found', () => {
      const result = archon.extractGithubRepo('How do I use this?');
      expect(result).toBeNull();
    });
  });

  describe('gatherContext', () => {
    it('should include DeepWiki context for documentation queries', async () => {
      const mockDeepWikiResponse = {
        repository: 'owner/repo',
        query: 'How do I use this?',
        structure: { files: ['README.md'] },
        answer: { response: 'test answer' }
      };

      DeepWikiMCP.mockImplementation(() => {
        return {
          comprehensiveSearch: jest.fn().mockResolvedValue(mockDeepWikiResponse)
        };
      });

      const intent = { 
        primary: 'documentation', 
        all: ['documentation'] 
      };
      
      research.deep_dive.mockResolvedValue({ key_insights: ['insight 1'] });

      const context = await archon.gatherContext('How do I use owner/repo?', intent, {});
      
      expect(context.deepWiki).toEqual(mockDeepWikiResponse);
    });

    it('should handle DeepWiki errors gracefully', async () => {
      DeepWikiMCP.mockImplementation(() => {
        return {
          comprehensiveSearch: jest.fn().mockRejectedValue(new Error('DeepWiki error'))
        };
      });

      const intent = { 
        primary: 'documentation', 
        all: ['documentation'] 
      };
      
      research.deep_dive.mockResolvedValue({ key_insights: ['insight 1'] });

      const context = await archon.gatherContext('How do I use owner/repo?', intent, {});
      
      expect(context.deepWiki).toBeNull();
    });
  });

  describe('generateResponse', () => {
    it('should include DeepWiki insights in the response', () => {
      const query = 'How do I use owner/repo?';
      const intent = { primary: 'documentation' };
      const contextData = {
        deepWiki: {
          answer: { response: 'test answer' }
        }
      };

      const response = archon.generateResponse(query, intent, contextData);
      
      expect(response.deepwiki_insights).toEqual({ response: 'test answer' });
    });
  });
});

describe('lightweight_archon_query', () => {
  it('should create an archon instance and call query', async () => {
    const mockResult = { answer: 'test' };
    LightweightArchon.mockImplementation(() => {
      return {
        query: jest.fn().mockResolvedValue(mockResult)
      };
    });

    const result = await lightweight_archon_query({ query: 'test' });
    
    expect(result).toEqual(mockResult);
  });
});