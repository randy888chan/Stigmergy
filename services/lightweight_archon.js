import { CodeRAGIntegration } from './coderag_integration.js';
import * as research from '../tools/research.js';
import { DeepWikiMCP } from './deepwiki_mcp.js';

export class LightweightArchon {
  constructor(options = {}) {
    this.storage = options.storage || 'neo4j';
    this.coderag = new CodeRAGIntegration();
    this.supabaseClient = null;
    
    if (this.storage === 'supabase') {
      this.initializeSupabase();
    }
  }

  async initializeSupabase() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      this.supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.warn('⚠️ Supabase not available, falling back to Neo4j');
      this.storage = 'neo4j';
    }
  }

  async query({ query, context = {}, options = {} }) {
    console.log(`🔍 LightweightArchon processing: "${query}"`);
    
    const startTime = Date.now();
    const intent = await this.analyzeQueryIntent(query);
    const contextData = await this.gatherContext(query, intent, context);
    const response = await this.generateResponse(query, intent, contextData);
    
    if (options.storeInsights) {
      await this.storeInsights(query, response, Date.now() - startTime);
    }
    
    return {
      ...response,
      processing_time: Date.now() - startTime,
      storage_backend: this.storage,
      context_sources: Object.keys(contextData)
    };
  }

  async analyzeQueryIntent(query) {
    const patterns = {
      code_search: /\b(find|search|locate|where is)\b.*\b(function|class|method|variable)\b/i,
      documentation: /\b(how to|explain|what is|describe)\b/i,
      research: /\b(research|analyze|investigate|compare)\b/i,
      implementation: /\b(implement|create|build|develop)\b/i
    };

    const intents = [];
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        intents.push(type);
      }
    }

    return {
      primary: intents[0] || 'general',
      all: intents,
      confidence: intents.length > 0 ? 0.8 : 0.3
    };
  }

  async gatherContext(query, intent, userContext) {
    const contextData = {};

    if (intent.all.includes('code_search') || intent.all.includes('implementation')) {
      try {
        contextData.codeIntelligence = await this.coderag.semanticSearch(query, {
          limit: 10
        });
      } catch (error) {
        contextData.codeIntelligence = { results: [] };
      }
    }

    if (intent.all.includes('research') || intent.all.includes('documentation')) {
      try {
        contextData.webResearch = await research.deep_dive({ query });
      } catch (error) {
        contextData.webResearch = { key_insights: [] };
      }
      
      // Add DeepWiki context for documentation/research queries
      try {
        const githubRepo = this.extractGithubRepo(query);
        if (githubRepo) {
          const deepwiki = new DeepWikiMCP();
          contextData.deepWiki = await deepwiki.comprehensiveSearch(githubRepo, query);
        }
      } catch (error) {
        console.warn('Failed to gather DeepWiki context:', error.message);
        contextData.deepWiki = null;
      }
    }

    contextData.userContext = userContext;
    return contextData;
  }

  /**
   * Extract GitHub repository from query if mentioned
   * @param {string} query - The query string
   * @returns {string|null} GitHub repository in format "owner/repo" or null
   */
  extractGithubRepo(query) {
    // Match patterns like "github.com/owner/repo" or "owner/repo"
    const githubPattern = /(?:github\.com\/)?([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/;
    const match = query.match(githubPattern);
    return match ? match[1] : null;
  }

  generateResponse(query, intent, contextData) {
    const response = {
      answer: '',
      insights: [],
      recommendations: [],
      code_examples: []
    };

    switch (intent.primary) {
      case 'code_search':
        response.answer = this.generateCodeSearchResponse(query, contextData);
        response.code_examples = this.extractCodeExamples(contextData.codeIntelligence);
        break;
        
      case 'documentation':
        response.answer = this.generateDocumentationResponse(query, contextData);
        break;
        
      case 'research':
        response.answer = this.generateResearchResponse(query, contextData);
        response.insights = contextData.webResearch?.key_insights || [];
        break;
        
      default:
        response.answer = `Analyzed query "${query}" across multiple sources.`;
    }

    // Add DeepWiki insights if available
    if (contextData.deepWiki?.answer) {
      response.deepwiki_insights = contextData.deepWiki.answer;
    }

    return response;
  }

  generateCodeSearchResponse(query, contextData) {
    const results = contextData.codeIntelligence?.results || [];
    
    if (results.length === 0) {
      return `No code matches found for "${query}".`;
    }

    let response = `Found ${results.length} code matches:\n\n`;
    results.slice(0, 5).forEach((result, index) => {
      response += `${index + 1}. **${result.symbol.name}** (${result.symbol.type})\n`;
      response += `   Location: ${result.symbol.file}\n\n`;
    });

    return response;
  }

  generateDocumentationResponse(query, contextData) {
    const webInsights = contextData.webResearch?.key_insights || [];
    let response = `Documentation for "${query}":\n\n`;
    
    if (webInsights.length > 0) {
      response += webInsights.slice(0, 3).map(insight => `• ${insight}`).join('\n');
    }
    
    return response;
  }

  generateResearchResponse(query, contextData) {
    const insights = contextData.webResearch?.key_insights || [];
    
    if (insights.length === 0) {
      return `No research insights found for "${query}".`;
    }
    
    return `Research findings:\n\n${insights.map(insight => `• ${insight}`).join('\n')}`;
  }

  extractCodeExamples(codeIntelligence) {
    if (!codeIntelligence?.results) return [];
    
    return codeIntelligence.results.slice(0, 3).map(result => ({
      symbol: result.symbol.name,
      type: result.symbol.type,
      file: result.symbol.file
    }));
  }

  async storeInsights(query, response, processingTime) {
    const insight = {
      query,
      response_summary: response.answer.substring(0, 500),
      processing_time: processingTime,
      timestamp: new Date().toISOString()
    };

    if (this.storage === 'supabase' && this.supabaseClient) {
      try {
        await this.supabaseClient
          .from('archon_insights')
          .insert([insight]);
      } catch (error) {
        console.warn('Failed to store insight in Supabase:', error.message);
      }
    } else {
      try {
        const query_neo4j = `
          CREATE (i:Insight {
            query: $query,
            response_summary: $response_summary,
            processing_time: $processing_time,
            timestamp: datetime($timestamp)
          })
        `;
        
        await this.coderag._runQuery(query_neo4j, insight);
      } catch (error) {
        console.warn('Failed to store insight in Neo4j:', error.message);
      }
    }
  }
}

export async function lightweight_archon_query({ query, options = {} }) {
  const archon = new LightweightArchon({ 
    storage: options.storage || 'neo4j' 
  });
  return await archon.query({ query, options });
}