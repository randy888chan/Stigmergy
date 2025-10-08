import dotenv from 'dotenv';
import { Neo4jConfig, ProjectConfig, SemanticSearchConfig } from './types.js';

dotenv.config();

export function getConfig(): Neo4jConfig {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error(`Missing required Neo4J configuration. Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables.`);
  }

  return {
    uri,
    user,
    password
  };
}

export function getProjectConfig(): ProjectConfig {
  return {
    isolation_strategy: (process.env.PROJECT_ISOLATION_STRATEGY as 'shared_db' | 'separate_db') || 'shared_db',
    default_project: process.env.DEFAULT_PROJECT_ID || undefined,
    cross_project_analysis: process.env.CROSS_PROJECT_ANALYSIS === 'true',
    max_projects_shared_db: parseInt(process.env.MAX_PROJECTS_SHARED_DB || '100', 10)
  };
}

// Project context utilities
export class ProjectContextManager {
  private static currentProject: string | undefined;

  static setCurrentProject(projectId: string): void {
    this.currentProject = projectId;
  }

  static getCurrentProject(): string | undefined {
    return this.currentProject;
  }

  static requireCurrentProject(): string {
    if (!this.currentProject) {
      const defaultProject = getProjectConfig().default_project;
      if (defaultProject) {
        this.currentProject = defaultProject;
        return defaultProject;
      }
      throw new Error('No current project set. Use setCurrentProject() or configure DEFAULT_PROJECT_ID.');
    }
    return this.currentProject;
  }

  static clearCurrentProject(): void {
    this.currentProject = undefined;
  }

  // Utility to generate project-scoped IDs
  static generateProjectScopedId(entityId: string, projectId?: string): string {
    const pid = projectId || this.requireCurrentProject();
    return `${pid}:${entityId}`;
  }

  // Utility to parse project-scoped IDs
  static parseProjectScopedId(scopedId: string): { projectId: string; entityId:
string } {
    const [projectId, ...entityParts] = scopedId.split(':');
    return {
      projectId,
      entityId: entityParts.join(':')
    };
  }
}

export function getSemanticSearchConfig(): SemanticSearchConfig {
  const provider = (process.env.SEMANTIC_SEARCH_PROVIDER as 'openai' | 'ollama' | 'disabled') || 'disabled';
  const model = process.env.EMBEDDING_MODEL || getDefaultModel(provider);
  const api_key = process.env.OPENAI_API_KEY;
  const base_url = process.env.OPENAI_BASE_URL || process.env.OLLAMA_BASE_URL;

  // Default dimensions based on model and provider
  const defaultDimensions = getDefaultDimensions(model, provider);

  return {
    provider,
    model,
    api_key,
    base_url,
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || defaultDimensions.toString(), 10),
    max_tokens: parseInt(process.env.EMBEDDING_MAX_TOKENS || '8000', 10),
    batch_size: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10),
    similarity_threshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7')
  };
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'text-embedding-3-small';
    case 'ollama':
      return 'nomic-embed-text';
    default:
      return 'text-embedding-3-small';
  }
}

function getDefaultDimensions(model: string, provider: string): number {
  // OpenAI models
  if (provider === 'openai') {
    switch (model) {
      case 'text-embedding-3-small':
        return 1536;
      case 'text-embedding-3-large':
        return 3072;
      case 'text-embedding-ada-002':
        return 1536;
      default:
        return 1536;
    }
  }

  // Ollama models
  if (provider === 'ollama') {
    switch (model) {
      case 'nomic-embed-text':
        return 768;
      case 'mxbai-embed-large':
        return 1024;
      default:
        return 768;
    }
  }

  return 1536; // Default fallback
}