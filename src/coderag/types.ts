// src/coderag/types.ts

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
}

export interface ProjectConfig {
  isolation_strategy: 'shared_db' | 'separate_db';
  default_project?: string;
  cross_project_analysis: boolean;
  max_projects_shared_db: number;
}

export interface ProjectContext {
  project_id: string;
  organizationId: string;
  name?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CodeNode {
  id: string;
  project_id: string;
  organizationId: string;
  type: 'class' | 'interface' | 'enum' | 'exception' | 'function' | 'method' | 'field' | 'package' | 'module';
  name: string;
  qualified_name: string;
  description?: string;
  source_file?: string;
  start_line?: number;
  end_line?: number;
  modifiers?: string[];
  attributes?: Record<string, any>;
}

export interface CodeEdge {
  id: string;
  project_id: string;
  organizationId: string;
  type: 'calls' | 'implements' | 'extends' | 'contains' | 'references' | 'throws' | 'belongs_to';
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

export interface QueryResult {
  records: any[];
  summary: any;
}

export interface AnnotationInfo {
  name: string;
  type: 'annotation' | 'decorator';
  parameters?: ParsedAnnotationParameter[];
  source_line?: number;
  framework?: string;
  category?: string;
}

export interface ParsedAnnotationParameter {
  name?: string;
  value: string;
  type?: string;
}

export interface SemanticEmbedding {
  vector: number[];
  model: string;
  version: string;
  created_at: Date;
}

export interface SemanticSearchParams {
  query: string;
  project_id?: string;
  node_types?: string[];
  limit?: number;
  similarity_threshold?: number;
}

export interface SemanticSearchResult {
  node: CodeNode;
  similarity_score: number;
  matched_content: string;
}

export interface Framework {
    name: string;
    language: string;
}

export interface FrameworkDetector {
    detect(sourceCode: string): Framework | null;
}

export interface SemanticSearchConfig {
    provider: 'openai' | 'ollama' | 'disabled';
    model: string;
    api_key?: string;
    base_url?: string;
    dimensions: number;
    max_tokens: number;
    batch_size: number;
    similarity_threshold: number;
}