// Code Reference Indexer for Stigmergy
// Analyzes GitHub repositories and extracts reusable code patterns
import { Octokit } from '@octokit/rest';
import { parse } from '@babel/parser';
import * as ts from 'typescript';
import * as fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import * as neo4j from 'neo4j-driver';

let driver;
let octokit;
let aiProvider;

// Initialize services
async function initializeServices() {
  // Initialize GitHub API
  if (process.env.GITHUB_TOKEN) {
    octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  } else {
    console.warn('GITHUB_TOKEN not found. Using unauthenticated requests (limited).');
    octokit = new Octokit();
  }

  // Initialize Neo4j
  if (process.env.NEO4J_URI) {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
    );
  }

  // Initialize AI provider
  try {
    const providers = await import('../ai/providers.js');
    aiProvider = providers.default || providers;
  } catch (error) {
    console.warn('AI provider not available for embeddings:', error.message);
  }
}

/**
 * Main class for indexing GitHub repositories
 */
export class CodeReferenceIndexer {
  constructor() {
    this.indexedPatterns = new Map();
    this.repositoryCache = new Map();
  }

  /**
   * Index a GitHub repository for code patterns
   */
  async indexRepository(owner, repo, options = {}) {
    await initializeServices();
    
    console.log(`🔍 Indexing ${owner}/${repo}...`);
    
    try {
      // Get repository metadata
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      
      // Get repository structure
      const structure = await this.getRepositoryStructure(owner, repo);
      
      // Process code files
      const patterns = [];
      for (const file of structure.codeFiles) {
        try {
          const filePatterns = await this.analyzeCodeFile(owner, repo, file.path, {
            language: this.detectLanguage(file.path),
            ...options
          });
          patterns.push(...filePatterns);
        } catch (error) {
          console.warn(`Failed to analyze ${file.path}:`, error.message);
        }
      }

      // Store patterns in Neo4j if available
      if (driver) {
        await this.storeReferencePatterns(patterns, {
          owner,
          repo,
          metadata: {
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            language: repoData.language,
            description: repoData.description,
            lastUpdated: repoData.updated_at
          }
        });
      }

      // Save to local cache
      const cacheFile = path.join(process.cwd(), 'cache', 'code-patterns', `${owner}-${repo}.json`);
      await fs.ensureDir(path.dirname(cacheFile));
      await fs.writeJson(cacheFile, {
        repository: { owner, repo },
        patterns,
        metadata: repoData,
        indexedAt: new Date().toISOString()
      }, { spaces: 2 });

      console.log(`✅ Indexed ${patterns.length} patterns from ${owner}/${repo}`);
      return {
        success: true,
        patterns,
        count: patterns.length,
        repository: `${owner}/${repo}`
      };
    } catch (error) {
      console.error(`❌ Failed to index ${owner}/${repo}:`, error.message);
      return {
        success: false,
        error: error.message,
        repository: `${owner}/${repo}`
      };
    }
  }

  /**
   * Get repository structure focusing on code files
   */
  async getRepositoryStructure(owner, repo, path = '') {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });

    const structure = {
      codeFiles: [],
      directories: [],
      totalFiles: 0
    };

    for (const item of contents) {
      if (item.type === 'file' && this.isCodeFile(item.name)) {
        structure.codeFiles.push({
          path: item.path,
          name: item.name,
          size: item.size,
          sha: item.sha
        });
        structure.totalFiles++;
      } else if (item.type === 'dir' && this.shouldIndexDirectory(item.name)) {
        structure.directories.push(item.name);
        // Recursively get subdirectories (limited depth)
        if (path.split('/').length < 3) {
          try {
            const subStructure = await this.getRepositoryStructure(owner, repo, item.path);
            structure.codeFiles.push(...subStructure.codeFiles);
            structure.totalFiles += subStructure.totalFiles;
          } catch (error) {
            console.warn(`Could not access directory ${item.path}:`, error.message);
          }
        }
      }
    }

    return structure;
  }

  /**
   * Analyze a specific code file
   */
  async analyzeCodeFile(owner, repo, filePath, options = {}) {
    try {
      const { data: file } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath
      });

      if (file.size > 1024 * 1024) { // Skip files larger than 1MB
        console.warn(`Skipping large file: ${filePath} (${file.size} bytes)`);
        return [];
      }

      const content = Buffer.from(file.content, 'base64').toString('utf8');
      const language = options.language || this.detectLanguage(filePath);

      // Parse and analyze the code
      const patterns = await this.extractCodePatterns(content, {
        language,
        filePath,
        repository: `${owner}/${repo}`,
        fileMetadata: {
          size: file.size,
          sha: file.sha,
          lastModified: file.lastModified
        }
      });

      return patterns;
    } catch (error) {
      console.warn(`Failed to analyze file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Extract code patterns from file content
   */
  async extractCodePatterns(content, context = {}) {
    const patterns = [];
    const { language, filePath, repository } = context;

    try {
      let ast;
      
      // Parse based on language
      if (language === 'javascript' || language === 'typescript') {
        ast = parse(content, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx', 'decorators-legacy']
        });
      } else if (language === 'typescript') {
        ast = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
      }

      if (ast) {
        const extractedPatterns = this.analyzeAST(ast, content, context);
        patterns.push(...extractedPatterns);
      }

      // Also extract patterns using regex for broader coverage
      const regexPatterns = this.extractPatternsWithRegex(content, context);
      patterns.push(...regexPatterns);

      return patterns;
    } catch (error) {
      console.warn(`AST parsing failed for ${filePath}, using regex fallback:`, error.message);
      return this.extractPatternsWithRegex(content, context);
    }
  }

  /**
   * Analyze AST to extract meaningful patterns
   */
  analyzeAST(ast, content, context) {
    const patterns = [];
    const lines = content.split('\n');

    // This is a simplified AST analysis - you can expand this based on @babel/traverse
    if (ast.body) {
      for (const node of ast.body) {
        const pattern = this.extractPatternFromNode(node, lines, context);
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Extract patterns using regex (fallback method)
   */
  extractPatternsWithRegex(content, context) {
    const patterns = [];
    const { language, filePath, repository } = context;

    // Common patterns to extract
    const patternRegexes = {
      functions: /(?:function\s+(\w+)|(\w+)\s*:\s*function|(\w+)\s*=\s*function|(\w+)\s*=>\s*)/g,
      classes: /class\s+(\w+)(?:\s+extends\s+(\w+))?/g,
      interfaces: /interface\s+(\w+)/g,
      imports: /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      exports: /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      asyncFunctions: /async\s+function\s+(\w+)|(\w+)\s*=\s*async/g,
      hooks: /use[A-Z]\w+/g, // React hooks pattern
      apiCalls: /(?:fetch|axios|http)\s*\(|\.(?:get|post|put|delete)\s*\(/g
    };

    for (const [type, regex] of Object.entries(patternRegexes)) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const patternCode = this.extractPatternContext(content, match.index, 200);
        
        patterns.push({
          id: this.generatePatternId(patternCode),
          type,
          name: match[1] || match[2] || match[3] || type,
          code: patternCode,
          language,
          filePath,
          repository,
          line: this.getLineNumber(content, match.index),
          complexity: this.analyzeComplexity(patternCode),
          keywords: this.extractKeywords(patternCode),
          embedding: null // Will be generated later if AI is available
        });
      }
    }

    return patterns;
  }

  /**
   * Store patterns in Neo4j
   */
  async storeReferencePatterns(patterns, repositoryInfo) {
    if (!driver) {
      console.warn('Neo4j not available, skipping pattern storage');
      return;
    }

    const session = driver.session();
    
    try {
      // Create repository node
      await session.run(`
        MERGE (repo:Repository {fullName: $fullName})
        SET repo.owner = $owner,
            repo.name = $name,
            repo.stars = $stars,
            repo.forks = $forks,
            repo.language = $language,
            repo.description = $description,
            repo.lastUpdated = $lastUpdated,
            repo.indexedAt = datetime()
      `, {
        fullName: `${repositoryInfo.owner}/${repositoryInfo.repo}`,
        owner: repositoryInfo.owner,
        name: repositoryInfo.repo,
        stars: repositoryInfo.metadata?.stars || 0,
        forks: repositoryInfo.metadata?.forks || 0,
        language: repositoryInfo.metadata?.language,
        description: repositoryInfo.metadata?.description,
        lastUpdated: repositoryInfo.metadata?.lastUpdated
      });

      // Store patterns
      for (const pattern of patterns) {
        // Generate embedding if AI is available
        if (aiProvider && !pattern.embedding) {
          try {
            pattern.embedding = await this.generateEmbedding(pattern.code);
          } catch (error) {
            console.warn('Failed to generate embedding:', error.message);
          }
        }

        await session.run(`
          MATCH (repo:Repository {fullName: $repoName})
          CREATE (pattern:CodePattern {
            id: $id,
            type: $type,
            name: $name,
            code: $code,
            language: $language,
            filePath: $filePath,
            line: $line,
            complexity: $complexity,
            keywords: $keywords,
            embedding: $embedding
          })
          CREATE (repo)-[:CONTAINS]->(pattern)
        `, {
          repoName: pattern.repository,
          id: pattern.id,
          type: pattern.type,
          name: pattern.name,
          code: pattern.code,
          language: pattern.language,
          filePath: pattern.filePath,
          line: pattern.line,
          complexity: pattern.complexity?.level || 'unknown',
          keywords: pattern.keywords || [],
          embedding: pattern.embedding
        });
      }

      console.log(`💾 Stored ${patterns.length} patterns in Neo4j`);
    } catch (error) {
      console.error('Failed to store patterns in Neo4j:', error.message);
    } finally {
      await session.close();
    }
  }

  // Utility methods

  isCodeFile(filename) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  shouldIndexDirectory(dirname) {
    const excludedDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '__pycache__'];
    return !excludedDirs.includes(dirname.toLowerCase());
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift'
    };
    return languageMap[ext] || 'text';
  }

  extractPatternFromNode(node, lines, context) {
    // This is a simplified version - expand based on your needs
    if (node.type === 'FunctionDeclaration' && node.id) {
      const startLine = node.loc?.start?.line || 1;
      const endLine = node.loc?.end?.line || startLine + 10;
      const code = lines.slice(startLine - 1, endLine).join('\n');
      
      return {
        id: this.generatePatternId(code),
        type: 'function',
        name: node.id.name,
        code,
        language: context.language,
        filePath: context.filePath,
        repository: context.repository,
        line: startLine,
        complexity: this.analyzeComplexity(code),
        keywords: this.extractKeywords(code)
      };
    }
    return null;
  }

  extractPatternContext(content, index, contextSize = 200) {
    const start = Math.max(0, index - contextSize);
    const end = Math.min(content.length, index + contextSize);
    return content.substring(start, end).trim();
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  analyzeComplexity(code) {
    const lines = code.split('\n').length;
    const cyclomaticComplexity = (code.match(/if|for|while|switch|catch|&&|\|\|/g) || []).length;
    
    return {
      lines,
      cyclomaticComplexity,
      level: cyclomaticComplexity > 10 ? 'high' : cyclomaticComplexity > 5 ? 'medium' : 'low'
    };
  }

  extractKeywords(code) {
    const keywords = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)]
      .filter(word => word.length > 2 && !['function', 'const', 'let', 'var', 'return'].includes(word))
      .slice(0, 10);
    return uniqueKeywords;
  }

  generatePatternId(code) {
    return crypto.createHash('md5').update(code).digest('hex').substring(0, 12);
  }

  async generateEmbedding(text) {
    if (!aiProvider) return null;
    
    try {
      const response = await aiProvider.generateEmbedding({
        input: text.substring(0, 2000), // Limit text size
        model: 'text-embedding-3-small'
      });
      return response.embedding || response.data?.[0]?.embedding;
    } catch (error) {
      console.warn('Failed to generate embedding:', error.message);
      return null;
    }
  }
}

/**
 * Default repositories to index for common patterns
 */
const DEFAULT_REPOS = [
  { owner: 'expressjs', repo: 'express' },
  { owner: 'lodash', repo: 'lodash' },
  { owner: 'moment', repo: 'moment.js' },
  { owner: 'chartjs', repo: 'Chart.js' },
  { owner: 'axios', repo: 'axios' },
  { owner: 'prettier', repo: 'prettier' },
  { owner: 'reactjs', repo: 'react' },
  { owner: 'vuejs', repo: 'vue' },
  { owner: 'nodejs', repo: 'node' },
  { owner: 'microsoft', repo: 'typescript' }
];

/**
 * Index default high-quality repositories
 */
export async function indexDefaultRepos() {
  const indexer = new CodeReferenceIndexer();
  const results = [];
  
  console.log('🚀 Starting indexing of default repositories...');
  
  for (const repo of DEFAULT_REPOS) {
    try {
      const result = await indexer.indexRepository(repo.owner, repo.repo);
      results.push(result);
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to index ${repo.owner}/${repo.repo}:`, error.message);
      results.push({
        success: false,
        repository: `${repo.owner}/${repo.repo}`,
        error: error.message
      });
    }
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Indexing complete: ${successful.length} successful, ${failed.length} failed`);
  console.log(`📊 Total patterns indexed: ${successful.reduce((sum, r) => sum + (r.count || 0), 0)}`);
  
  return {
    successful,
    failed,
    totalPatterns: successful.reduce((sum, r) => sum + (r.count || 0), 0)
  };
}

export default CodeReferenceIndexer;