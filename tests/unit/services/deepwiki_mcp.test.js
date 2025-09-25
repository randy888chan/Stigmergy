import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock axios before importing the module that uses it
mock.module('axios', () => ({
  default: {
    post: mock(),
  }
}));

// Import the modules after mocking
import axios from 'axios';
import { DeepWikiMCP } from '../../../services/deepwiki_mcp.js';

describe('DeepWikiMCP', () => {
  let deepwiki;
  
  beforeEach(() => {
    mock.restore(); // Use Bun's global mock restoration
    deepwiki = new DeepWikiMCP({ serverUrl: 'https://mcp.deepwiki.com', protocol: 'sse' });
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      const instance = new DeepWikiMCP();
      expect(instance.serverUrl).toBe('https://mcp.deepwiki.com');
      expect(instance.protocol).toBe('sse');
    });

    test('should initialize with custom values', () => {
      const instance = new DeepWikiMCP({
        serverUrl: 'https://custom.deepwiki.com',
        protocol: 'mcp'
      });
      expect(instance.serverUrl).toBe('https://custom.deepwiki.com');
      expect(instance.protocol).toBe('mcp');
    });
  });

  describe('getEndpointUrl', () => {
    test('should return correct SSE endpoint URL', () => {
      const url = deepwiki.getEndpointUrl('/tools/call');
      expect(url).toBe('https://mcp.deepwiki.com/sse/tools/call');
    });

    test('should return correct MCP endpoint URL', () => {
      deepwiki.protocol = 'mcp';
      const url = deepwiki.getEndpointUrl('/tools/call');
      expect(url).toBe('https://mcp.deepwiki.com/mcp/tools/call');
    });
  });

  describe('readWikiStructure', () => {
    test('should call the read_wiki_structure tool', async () => {
      const mockResponse = {
        data: {
          result: {
            content: [{
              text: JSON.stringify({ structure: 'test' })
            }]
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await deepwiki.readWikiStructure('owner/repo');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://mcp.deepwiki.com/sse/tools/call',
        {
          name: 'read_wiki_structure',
          arguments: { repository: 'owner/repo' }
        }
      );
      expect(result).toEqual({ structure: 'test' });
    });
  });

  describe('readWikiContents', () => {
    test('should call the read_wiki_contents tool', async () => {
      const mockResponse = {
        data: {
          result: {
            content: [{
              text: JSON.stringify({ content: 'test content' })
            }]
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await deepwiki.readWikiContents('owner/repo', 'README.md');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://mcp.deepwiki.com/sse/tools/call',
        {
          name: 'read_wiki_contents',
          arguments: { repository: 'owner/repo', path: 'README.md' }
        }
      );
      expect(result).toEqual({ content: 'test content' });
    });
  });

  describe('askQuestion', () => {
    test('should call the ask_question tool', async () => {
      const mockResponse = {
        data: {
          result: {
            content: [{
              text: JSON.stringify({ answer: 'test answer' })
            }]
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await deepwiki.askQuestion('owner/repo', 'How do I use this?');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://mcp.deepwiki.com/sse/tools/call',
        {
          name: 'ask_question',
          arguments: { repository: 'owner/repo', question: 'How do I use this?' }
        }
      );
      expect(result).toEqual({ answer: 'test answer' });
    });
  });

  describe('comprehensiveSearch', () => {
    test('should perform a comprehensive search', async () => {
      const structureResponse = {
        data: {
          result: {
            content: [{
              text: JSON.stringify({ structure: 'test structure' })
            }]
          }
        }
      };
      const questionResponse = {
        data: {
          result: {
            content: [{
              text: JSON.stringify({ answer: 'test answer' })
            }]
          }
        }
      };
      
      axios.post
        .mockResolvedValueOnce(structureResponse)
        .mockResolvedValueOnce(questionResponse);

      const result = await deepwiki.comprehensiveSearch('owner/repo', 'How do I use this?');
      
      expect(result).toEqual({
        repository: 'owner/repo',
        query: 'How do I use this?',
        structure: { structure: 'test structure' },
        answer: { answer: 'test answer' }
      });
    });
  });
});
