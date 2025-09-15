import axios from 'axios';

/**
 * DeepWiki MCP Client for accessing public repository documentation
 * 
 * This service provides programmatic access to DeepWiki's public repository 
 * documentation and search capabilities (Ask Devin).
 * 
 * Base Server URL: https://mcp.deepwiki.com/
 * Supported Protocols: SSE (Server-Sent Events) and Streamable HTTP
 */

const DEEPWIKI_MCP_BASE_URL = 'https://mcp.deepwiki.com';

export class DeepWikiMCP {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || DEEPWIKI_MCP_BASE_URL;
    this.protocol = options.protocol || 'sse'; // 'sse' or 'mcp'
  }

  /**
   * Get the full URL for a specific endpoint
   * @param {string} endpoint - The endpoint path
   * @returns {string} The full URL
   */
  getEndpointUrl(endpoint) {
    const protocolPath = this.protocol === 'sse' ? '/sse' : '/mcp';
    return `${this.serverUrl}${protocolPath}${endpoint}`;
  }

  /**
   * Get a list of documentation topics for a GitHub repository
   * @param {string} repository - GitHub repository in format "owner/repo"
   * @returns {Promise<Object>} Documentation structure
   */
  async readWikiStructure(repository) {
    try {
      const response = await axios.post(this.getEndpointUrl('/tools/call'), {
        name: 'read_wiki_structure',
        arguments: { repository }
      });
      
      return response.data.result?.content?.[0]?.text ? 
        JSON.parse(response.data.result.content[0].text) : 
        response.data;
    } catch (error) {
      console.error('Error reading wiki structure:', error.message);
      throw error;
    }
  }

  /**
   * View documentation about a GitHub repository
   * @param {string} repository - GitHub repository in format "owner/repo"
   * @param {string} path - Path to specific documentation file
   * @returns {Promise<Object>} Documentation content
   */
  async readWikiContents(repository, path) {
    try {
      const response = await axios.post(this.getEndpointUrl('/tools/call'), {
        name: 'read_wiki_contents',
        arguments: { repository, path }
      });
      
      return response.data.result?.content?.[0]?.text ? 
        JSON.parse(response.data.result.content[0].text) : 
        response.data;
    } catch (error) {
      console.error('Error reading wiki contents:', error.message);
      throw error;
    }
  }

  /**
   * Ask any question about a GitHub repository and get an AI-powered, context-grounded response
   * @param {string} repository - GitHub repository in format "owner/repo"
   * @param {string} question - Question to ask about the repository
   * @returns {Promise<Object>} AI-powered response
   */
  async askQuestion(repository, question) {
    try {
      const response = await axios.post(this.getEndpointUrl('/tools/call'), {
        name: 'ask_question',
        arguments: { repository, question }
      });
      
      return response.data.result?.content?.[0]?.text ? 
        JSON.parse(response.data.result.content[0].text) : 
        response.data;
    } catch (error) {
      console.error('Error asking question:', error.message);
      throw error;
    }
  }

  /**
   * Comprehensive search combining structure, content, and Q&A
   * @param {string} repository - GitHub repository in format "owner/repo"
   * @param {string} query - Search query or question
   * @returns {Promise<Object>} Combined search results
   */
  async comprehensiveSearch(repository, query) {
    try {
      // First get the structure to understand what documentation is available
      const structure = await this.readWikiStructure(repository);
      
      // Then ask the question for context-grounded response
      const answer = await this.askQuestion(repository, query);
      
      return {
        repository,
        query,
        structure,
        answer
      };
    } catch (error) {
      console.error('Error in comprehensive search:', error.message);
      throw error;
    }
  }
}

// Default export for convenience
export async function query_deepwiki({ repository, question }) {
  const deepwiki = new DeepWikiMCP();
  return await deepwiki.comprehensiveSearch(repository, question);
}