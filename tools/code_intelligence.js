import { CodeIntelligenceService } from "../services/code_intelligence_service.js";
const codeIntelligenceService = new CodeIntelligenceService();
import { cachedQuery } from "../utils/queryCache.js";
import { getModelForTier } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";
import * as fs from 'fs-extra';
import path from 'path';
import * as neo4j from 'neo4j-driver';

// Neo4j driver for reference pattern queries
let driver;
if (process.env.NEO4J_URI) {
  driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
  );
}

export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}

export const getDefinition = cachedQuery("getDefinition", ({ symbolName }) =>
  codeIntelligenceService.getDefinition({ symbolName })
);

export async function getModuleDependencies({ filePath }) {
  return codeIntelligenceService.getModuleDependencies({ filePath });
}

export async function calculateCKMetrics({ className }) {
  return codeIntelligenceService.calculateCKMetrics({ className });
}

/**
 * NEW: Provides a high-level overview of the entire indexed codebase.
 * @returns {Promise<string>} A string summarizing the files, classes, and functions in the project.
 */
export async function get_full_codebase_context() {
  const query = `
    MATCH (f:Symbol {type: 'File'})
    OPTIONAL MATCH (f)-[:DEFINES]->(c:Symbol)
    WHERE c.type IN ['Class', 'Function', 'Variable']
    WITH f, collect({name: c.name, type: c.type}) AS members
    RETURN f.path AS file, members
    ORDER BY file
  `;
  try {
    const results = await codeIntelligenceService._runQuery(query);
    if (results.length === 0) {
      return "No code intelligence data found. The database may be empty or the initial indexing failed.";
    }

    let summary = "Current Codebase Structure:\\n\\n";
    results.forEach((record) => {
      const file = record.file;
      const members = record.members;
      summary += `- File: ${file}\\n`;
      if (members.length > 0 && members[0].name) {
        members.forEach((member) => {
          summary += `  - ${member.type}: ${member.name}\\n`;
        });
      } else {
        summary += `  (No defined classes or functions found)\\n`;
      }
    });
    return summary;
  } catch (error) {
    console.error("Failed to get full codebase context:", error);
    return `Error retrieving codebase context: ${error.message}. Ensure the Neo4j database is running and configured correctly.`;
  }
}

/**
 * NEW TOOL: Validates a proposed technology against project goals.
 * @param {object} args
 * @param {string} args.technology - The technology to validate (e.g., "React", "PostgreSQL").
 * @param {string} args.project_goal - The high-level project goal.
 * @returns {Promise<{is_suitable: boolean, pros: string[], cons: string[], recommendation: string}>}
 */
export async function validate_tech_stack({ technology, project_goal }) {
  console.log(`[Code Intelligence] Validating tech: ${technology} for goal: ${project_goal}`);
  const { object } = await generateObject({
    model: getModelForTier('b_tier'),
    prompt: `As a senior solutions architect, analyze the suitability of using "${technology}" for a project with the goal: "${project_goal}".
        Provide a concise analysis focusing on pros and cons. Conclude with a clear recommendation.`,
    schema: z.object({
      is_suitable: z
        .boolean()
        .describe("Is this technology a suitable choice for the project goal?"),
      pros: z.array(z.string()).describe("List 2-3 key advantages."),
      cons: z.array(z.string()).describe("List 2-3 key disadvantages or risks."),
      recommendation: z
        .string()
        .describe("A final recommendation on whether to use this technology."),
    }),
  });
  return object;
}

/**
 * NEW: Find reference patterns from indexed repositories
 * @param {object} args
 * @param {string} args.query - Search query for patterns
 * @param {string} args.language - Programming language filter
 * @param {string} args.type - Pattern type filter (function, class, etc.)
 * @param {number} args.limit - Maximum number of results
 */
export async function find_reference_patterns({ query, language = 'javascript', type = null, limit = 10 }) {
  console.log(`[Code Intelligence] Finding reference patterns for: ${query}`);
  
  try {
    // Try Neo4j first for fast semantic search
    if (driver) {
      const patterns = await searchPatternsInNeo4j({ query, language, type, limit });
      if (patterns.length > 0) {
        return {
          success: true,
          patterns,
          source: 'neo4j',
          count: patterns.length
        };
      }
    }
    
    // Fallback to local cache search
    const cachePatterns = await searchPatternsInCache({ query, language, type, limit });
    return {
      success: true,
      patterns: cachePatterns,
      source: 'cache',
      count: cachePatterns.length
    };
  } catch (error) {
    console.error('Error finding reference patterns:', error.message);
    return {
      success: false,
      error: error.message,
      patterns: []
    };
  }
}

/**
 * Search patterns in Neo4j using semantic similarity
 */
async function searchPatternsInNeo4j({ query, language, type, limit }) {
  if (!driver) return [];
  
  const session = driver.session();
  
  try {
    // Generate embedding for the query if possible
    let queryEmbedding = null;
    try {
      const aiProvider = await import('../ai/providers.js');
      if (aiProvider.default) {
        const embeddingResponse = await aiProvider.default.generateEmbedding({
          input: query,
          model: 'text-embedding-3-small'
        });
        queryEmbedding = embeddingResponse.embedding || embeddingResponse.data?.[0]?.embedding;
      }
    } catch (error) {
      console.warn('Could not generate query embedding:', error.message);
    }
    
    let cypher = `
      MATCH (pattern:CodePattern)
      WHERE pattern.language = $language
    `;
    
    const params = { language, limit: parseInt(limit) };
    
    if (type) {
      cypher += ` AND pattern.type = $type`;
      params.type = type;
    }
    
    // Use semantic similarity if embedding is available
    if (queryEmbedding) {
      cypher += `
        AND pattern.embedding IS NOT NULL
        WITH pattern, gds.similarity.cosine(pattern.embedding, $queryEmbedding) AS similarity
        WHERE similarity > 0.3
        RETURN pattern, similarity
        ORDER BY similarity DESC
      `;
      params.queryEmbedding = queryEmbedding;
    } else {
      // Fallback to keyword search
      cypher += `
        AND (pattern.name CONTAINS $query OR pattern.code CONTAINS $query OR any(keyword IN pattern.keywords WHERE keyword CONTAINS $query))
        RETURN pattern, 1.0 AS similarity
        ORDER BY pattern.name
      `;
      params.query = query;
    }
    
    cypher += ` LIMIT $limit`;
    
    const result = await session.run(cypher, params);
    
    return result.records.map(record => {
      const pattern = record.get('pattern').properties;
      const similarity = record.get('similarity');
      
      return {
        id: pattern.id,
        name: pattern.name,
        type: pattern.type,
        code: pattern.code,
        language: pattern.language,
        filePath: pattern.filePath,
        repository: pattern.repository || 'unknown',
        complexity: pattern.complexity,
        keywords: pattern.keywords || [],
        similarity: parseFloat(similarity),
        line: pattern.line
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Search patterns in local cache files
 */
async function searchPatternsInCache({ query, language, type, limit }) {
  const cacheDir = path.join(process.cwd(), 'cache', 'code-patterns');
  
  if (!await fs.pathExists(cacheDir)) {
    console.warn('Pattern cache directory not found');
    return [];
  }
  
  const cacheFiles = await fs.readdir(cacheDir);
  const patterns = [];
  
  for (const file of cacheFiles) {
    if (!file.endsWith('.json')) continue;
    
    try {
      const filePath = path.join(cacheDir, file);
      const data = await fs.readJson(filePath);
      
      if (data.patterns) {
        const matchingPatterns = data.patterns.filter(pattern => {
          // Language filter
          if (pattern.language !== language) return false;
          
          // Type filter
          if (type && pattern.type !== type) return false;
          
          // Query match in name, code, or keywords
          const queryLower = query.toLowerCase();
          const nameMatch = pattern.name?.toLowerCase().includes(queryLower);
          const codeMatch = pattern.code?.toLowerCase().includes(queryLower);
          const keywordMatch = pattern.keywords?.some(k => k.toLowerCase().includes(queryLower));
          
          return nameMatch || codeMatch || keywordMatch;
        });
        
        // Add repository info
        matchingPatterns.forEach(pattern => {
          pattern.repository = data.repository ? `${data.repository.owner}/${data.repository.repo}` : 'unknown';
          pattern.similarity = calculateTextSimilarity(query, pattern.name + ' ' + pattern.code);
        });
        
        patterns.push(...matchingPatterns);
      }
    } catch (error) {
      console.warn(`Failed to read cache file ${file}:`, error.message);
    }
  }
  
  // Sort by similarity and limit results
  return patterns
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, parseInt(limit));
}

/**
 * Simple text similarity calculation
 */
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

/**
 * NEW: Generate Technical Implementation Brief using found patterns
 * @param {object} args
 * @param {string} args.requirements - Project requirements
 * @param {string} args.context - Additional context
 * @param {number} args.patternLimit - Max patterns to include
 */
export async function generate_implementation_brief({ requirements, context = '', patternLimit = 5 }) {
  console.log(`[Code Intelligence] Generating implementation brief for: ${requirements}`);
  
  try {
    // Extract key concepts from requirements
    const keywords = extractKeywords(requirements + ' ' + context);
    console.log('Extracted keywords:', keywords);
    
    // Find relevant patterns for each keyword
    const allPatterns = [];
    for (const keyword of keywords.slice(0, 3)) { // Limit to top 3 keywords
      const patternResult = await find_reference_patterns({
        query: keyword,
        language: 'javascript',
        limit: 3
      });
      
      if (patternResult.success) {
        allPatterns.push(...patternResult.patterns);
      }
    }
    
    // Remove duplicates and get top patterns
    const uniquePatterns = allPatterns.filter((pattern, index, array) => 
      array.findIndex(p => p.id === pattern.id) === index
    ).slice(0, patternLimit);
    
    // Generate the brief using AI
    const aiProvider = await import('../ai/providers.js');
    if (aiProvider.default) {
      const briefPrompt = `
Create a Technical Implementation Brief based on these requirements and reference patterns:

## Requirements:
${requirements}

## Context:
${context}

## Reference Patterns Found:
${uniquePatterns.map(p => `
### ${p.name} (${p.type})
**Repository:** ${p.repository}
**Complexity:** ${p.complexity}
**Code:**
\`\`\`${p.language}
${p.code.substring(0, 500)}${p.code.length > 500 ? '...' : ''}
\`\`\`
`).join('\n')}

## Instructions:
1. Analyze the requirements and identify key implementation challenges
2. Select the most relevant patterns from above
3. Adapt patterns to fit the specific requirements
4. Provide concrete implementation guidance
5. Include architecture recommendations
6. Suggest testing strategies

Create a comprehensive Technical Implementation Brief that bridges the requirements with the reference patterns.
`;
      
      const response = await aiProvider.default.generateText({
        prompt: briefPrompt,
        model: getModelForTier('s_tier'), // Use reasoning model for planning
        maxTokens: 3000
      });
      
      return {
        success: true,
        brief: response.text,
        patternsUsed: uniquePatterns.length,
        keywords,
        totalPatternsFound: allPatterns.length
      };
    }
    
    // Fallback: Generate basic brief without AI
    const basicBrief = generateBasicBrief(requirements, context, uniquePatterns);
    return {
      success: true,
      brief: basicBrief,
      patternsUsed: uniquePatterns.length,
      keywords,
      fallback: true
    };
  } catch (error) {
    console.error('Error generating implementation brief:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !isStopWord(word));
  
  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
}

function isStopWord(word) {
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
  return stopWords.includes(word);
}

function generateBasicBrief(requirements, context, patterns) {
  return `# Technical Implementation Brief

## Requirements
${requirements}

## Context
${context}

## Reference Patterns Found
${patterns.map(p => `
### ${p.name}
**Type:** ${p.type}
**Repository:** ${p.repository}
**Complexity:** ${p.complexity}

\`\`\`${p.language}
${p.code.substring(0, 300)}${p.code.length > 300 ? '...' : ''}
\`\`\`
`).join('\n')}

## Implementation Guidance
1. Review the reference patterns above
2. Adapt patterns to fit your specific requirements
3. Consider the complexity levels when implementing
4. Follow established patterns from high-quality repositories

## Next Steps
1. Select the most relevant patterns
2. Create a prototype implementation
3. Test and validate the approach
4. Iterate based on feedback
`;
}
