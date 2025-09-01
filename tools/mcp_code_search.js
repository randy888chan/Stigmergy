import { CodeRAGIntegration } from '../services/coderag_integration.js';
import { LightweightArchon } from '../services/lightweight_archon.js';

export class MCPCodeSearch {
  constructor() {
    this.coderag = new CodeRAGIntegration();
    this.archon = new LightweightArchon();
  }

  async handleCodeSearch(query, context = {}) {
    const searchResults = await Promise.all([
      this.semanticCodeSearch(query),
      this.symbolSearch(query),
      this.contextualSearch(query, context)
    ]);

    return this.combineSearchResults(searchResults, query);
  }

  async semanticCodeSearch(query) {
    try {
      const results = await this.coderag.semanticSearch(query, {
        limit: 10
      });
      
      return {
        type: 'semantic',
        results: results.results,
        confidence: 0.8
      };
    } catch (error) {
      console.warn('Semantic search failed:', error.message);
      return { type: 'semantic', results: [], confidence: 0 };
    }
  }

  async symbolSearch(query) {
    const symbols = this.extractSymbols(query);
    const results = [];

    for (const symbol of symbols) {
      try {
        const symbolResults = await this.coderag.findUsages({ symbolName: symbol });
        results.push(...symbolResults);
      } catch (error) {
        console.warn(`Symbol search failed for ${symbol}:`, error.message);
      }
    }

    return {
      type: 'symbol',
      results,
      confidence: symbols.length > 0 ? 0.9 : 0.2
    };
  }

  async contextualSearch(query, context) {
    try {
      const archonResult = await this.archon.query({
        query,
        context,
        options: { storeInsights: false }
      });

      return {
        type: 'contextual',
        results: archonResult.code_examples || [],
        insights: archonResult.insights || [],
        confidence: 0.7
      };
    } catch (error) {
      console.warn('Contextual search failed:', error.message);
      return { type: 'contextual', results: [], confidence: 0 };
    }
  }

  combineSearchResults(searchResults, originalQuery) {
    const combined = {
      query: originalQuery,
      results: [],
      insights: [],
      recommendations: []
    };

    for (const searchResult of searchResults) {
      if (searchResult.confidence > 0.5) {
        combined.results.push(...(searchResult.results || []));
        combined.insights.push(...(searchResult.insights || []));
      }
    }

    combined.results = this.deduplicateResults(combined.results);
    combined.recommendations = this.generateRecommendations(combined.results);

    return combined;
  }

  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.symbol?.name || result.name}-${result.symbol?.file || result.file}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.length === 0) {
      recommendations.push('No existing code found - this appears to be a new implementation');
    } else if (results.length > 10) {
      recommendations.push('Many similar implementations found - consider refactoring for reusability');
    } else {
      recommendations.push('Found relevant existing code - consider building upon these patterns');
    }

    return recommendations;
  }

  extractSymbols(query) {
    const patterns = [
      /\b[A-Z][a-zA-Z0-9]*\b/g, // PascalCase (classes)
      /\b[a-z][a-zA-Z0-9]*\b/g  // camelCase (functions/variables)
    ];

    const symbols = new Set();
    for (const pattern of patterns) {
      const matches = query.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 2) symbols.add(match);
      });
    }

    return Array.from(symbols).slice(0, 5);
  }
}

// Export functions for MCP server integration
export async function mcp_code_search({ query, context = {} }) {
  const searcher = new MCPCodeSearch();
  return await searcher.handleCodeSearch(query, context);
}

export async function mcp_symbol_lookup({ symbol }) {
  const searcher = new MCPCodeSearch();
  return await searcher.symbolSearch(symbol);
}

export async function mcp_contextual_query({ query, fileContext = '', projectContext = {} }) {
  const searcher = new MCPCodeSearch();
  return await searcher.contextualSearch(query, { fileContext, projectContext });
}