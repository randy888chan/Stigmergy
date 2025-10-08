import { loadEnv } from '../utils/env_loader.js';

// Dynamically import from the merged coderag source
import { Neo4jClient } from '../src/coderag/graph/neo4j-client.ts';
import { CodebaseScanner } from '../src/coderag/scanner/codebase-scanner.ts';
import { MetricsManager } from '../src/coderag/analysis/metrics-manager.ts';
import { SemanticSearchManager } from '../src/coderag/services/semantic-search-manager.ts';

class UnifiedIntelligenceService {
  constructor() {
    this.scanner = null;
    this.metrics = null;
    this.search = null;
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    const env = await loadEnv();

    if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
      console.warn("NEO4J credentials not found. UnifiedIntelligenceService will operate in a disabled state.");
      return;
    }

    try {
      const neo4jConfig = {
        uri: env.NEO4J_URI,
        user: env.NEO4J_USER,
        password: env.NEO4J_PASSWORD,
      };

      this.client = new Neo4jClient(neo4jConfig);
      await this.client.connect();

      this.scanner = new CodebaseScanner(this.client);
      this.metrics = new MetricsManager(this.client);
      this.search = new SemanticSearchManager(this.client);

      this.initialized = true;
      console.log("UnifiedIntelligenceService initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize UnifiedIntelligenceService:", error);
      this.initialized = false;
    }
  }

  async #ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.initialized) {
      throw new Error("UnifiedIntelligenceService is not initialized. Check Neo4j credentials and connection.");
    }
  }

  async scanCodebase({ project_root }) {
    await this.#ensureInitialized();
    if (!project_root) throw new Error("project_root is required for scanCodebase.");
    console.log(`Scanning codebase at ${project_root} with CodeRAG...`);
    const report = await this.scanner.scanProject({
        projectId: project_root.split('/').pop(),
        projectPath: project_root,
        languages: ['typescript', 'javascript', 'python', 'java'],
        includeTests: true,
    });
    console.log("Codebase scan complete.");
    return report.stats;
  }

  async calculateMetrics() {
    await this.#ensureInitialized();
    console.log("Calculating metrics with CodeRAG...");
    const metricsReport = await this.metrics.calculateProjectSummary();
    console.log("Metrics calculation complete.");
    return metricsReport;
  }

  async semanticSearch({ query, project_root }) {
    await this.#ensureInitialized();
    if (!project_root) throw new Error("project_root is required for semanticSearch.");
    console.log(`Performing semantic search for: "${query}"`);
    return await this.search.semanticSearch({
        query,
        project_id: project_root.split('/').pop()
    });
  }

  async findArchitecturalIssues() {
    await this.#ensureInitialized();
    console.log("Finding architectural issues with CodeRAG...");
    return await this.metrics.findArchitecturalIssues();
  }

  async testConnection() {
    // This method can be called before full initialization
    if (!this.client) {
        await this.initialize();
        if (!this.client) {
             return { status: 'error', message: 'Initialization failed, cannot test connection.' };
        }
    }
    try {
      const isHealthy = await this.client.healthCheck();
      if (isHealthy) {
        return { status: 'ok', message: 'Successfully connected to the CodeRAG backend.' };
      }
      return { status: 'error', message: 'Health check failed.' };
    } catch (error) {
      console.error('CodeRAG connection test failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  async runRawQuery(query, params) {
    await this.#ensureInitialized();
    console.log("Executing raw query with CodeRAG...");
    const result = await this.client.runQuery(query, params);
    return result.records.map(record => record.toObject());
  }
}

export const unifiedIntelligenceService = new UnifiedIntelligenceService();