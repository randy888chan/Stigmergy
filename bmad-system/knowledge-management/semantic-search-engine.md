# Semantic Search Engine

## Advanced Semantic Search and Knowledge Retrieval for Enhanced BMAD System

The Semantic Search Engine provides intelligent, context-aware search capabilities across all knowledge domains, using advanced vector embeddings, semantic understanding, and multi-modal search techniques.

### Semantic Search Architecture

#### Multi-Modal Search Framework
```yaml
semantic_search_architecture:
  search_modalities:
    text_search:
      - natural_language_queries: "Find authentication patterns for microservices"
      - code_search: "Search for functions similar to getUserProfile()"
      - concept_search: "Search for concepts related to caching strategies"
      - intent_search: "Search by development intent and goals"
      
    code_search:
      - semantic_code_search: "Find semantically similar code blocks"
      - structural_search: "Search by code structure and patterns"
      - functional_search: "Search by function signature and behavior"
      - ast_pattern_search: "Search by abstract syntax tree patterns"
      
    visual_search:
      - diagram_search: "Search architectural diagrams and flowcharts"
      - ui_mockup_search: "Search UI designs and wireframes"
      - chart_search: "Search data visualizations and metrics"
      - code_visualization_search: "Search code structure visualizations"
      
    contextual_search:
      - project_context_search: "Search within specific project contexts"
      - temporal_search: "Search by time periods and development phases"
      - team_context_search: "Search by team activities and contributions"
      - domain_context_search: "Search within specific technical domains"
      
  embedding_models:
    text_embeddings:
      - transformer_models: "BERT, RoBERTa, T5 for natural language"
      - domain_specific: "SciBERT for technical documentation"
      - multilingual: "mBERT for multiple languages"
      - instruction_tuned: "Instruction-following models"
      
    code_embeddings:
      - codebert: "Microsoft CodeBERT for code understanding"
      - graphcodebert: "Graph-based code representation"
      - codet5: "Code-text dual encoder"
      - unixcoder: "Unified cross-modal code representation"
      
    multimodal_embeddings:
      - clip_variants: "CLIP for text-image understanding"
      - code_clip: "Code-diagram understanding"
      - technical_clip: "Technical document understanding"
      - architectural_embeddings: "Architecture diagram understanding"
      
  search_strategies:
    similarity_search:
      - cosine_similarity: "Vector cosine similarity matching"
      - euclidean_distance: "L2 distance for vector proximity"
      - dot_product: "Inner product similarity"
      - learned_similarity: "Neural similarity functions"
      
    hybrid_search:
      - dense_sparse_fusion: "Combine vector and keyword search"
      - multi_vector_search: "Multiple embedding spaces"
      - cross_modal_search: "Search across different modalities"
      - contextual_reranking: "Context-aware result reranking"
      
    graph_search:
      - knowledge_graph_traversal: "Search through graph relationships"
      - semantic_path_finding: "Find semantic paths between concepts"
      - graph_embedding_search: "Node2Vec and Graph2Vec search"
      - community_detection_search: "Search within knowledge communities"
```

#### Advanced Search Engine Implementation
```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModel
import torch
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
from collections import defaultdict
import asyncio

class SemanticSearchEngine:
    """
    Advanced semantic search engine for multi-modal knowledge retrieval
    """
    
    def __init__(self):
        # Initialize embedding models
        self.text_encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.code_encoder = AutoModel.from_pretrained('microsoft/codebert-base')
        self.code_tokenizer = AutoTokenizer.from_pretrained('microsoft/codebert-base')
        
        # Initialize search indices
        self.text_index = None
        self.code_index = None
        self.multimodal_index = None
        self.graph_index = None
        
        # Initialize search strategies
        self.search_strategies = {
            'semantic_similarity': SemanticSimilaritySearch(),
            'hybrid_search': HybridSearch(),
            'graph_search': GraphSearch(),
            'contextual_search': ContextualSearch()
        }
        
        # Search result cache
        self.search_cache = {}
        self.cache_ttl = 3600  # 1 hour
        
    async def initialize_search_indices(self, knowledge_base):
        """
        Initialize all search indices from knowledge base
        """
        initialization_results = {
            'text_index': await self.build_text_index(knowledge_base),
            'code_index': await self.build_code_index(knowledge_base),
            'multimodal_index': await self.build_multimodal_index(knowledge_base),
            'graph_index': await self.build_graph_index(knowledge_base)
        }
        
        return initialization_results
    
    async def build_text_index(self, knowledge_base):
        """
        Build FAISS index for text-based semantic search
        """
        text_documents = []
        document_metadata = []
        
        # Extract text content from knowledge base
        for node_id, node_data in knowledge_base.nodes(data=True):
            if 'text_content' in node_data:
                text_documents.append(node_data['text_content'])
                document_metadata.append({
                    'node_id': node_id,
                    'type': node_data.get('type', 'unknown'),
                    'domain': node_data.get('domain', 'general'),
                    'timestamp': node_data.get('timestamp'),
                    'importance': node_data.get('importance_score', 1.0)
                })
        
        # Generate embeddings
        text_embeddings = self.text_encoder.encode(text_documents)
        
        # Build FAISS index
        dimension = text_embeddings.shape[1]
        self.text_index = faiss.IndexFlatIP(dimension)  # Inner product for similarity
        self.text_index.add(text_embeddings.astype('float32'))
        
        # Store metadata
        self.text_metadata = document_metadata
        
        return {
            'index_type': 'text',
            'documents_indexed': len(text_documents),
            'embedding_dimension': dimension,
            'index_size_mb': self.text_index.ntotal * dimension * 4 / 1024 / 1024
        }
    
    async def build_code_index(self, knowledge_base):
        """
        Build specialized index for code-based semantic search
        """
        code_documents = []
        code_metadata = []
        
        # Extract code content from knowledge base
        for node_id, node_data in knowledge_base.nodes(data=True):
            if 'code_content' in node_data:
                code_documents.append(node_data['code_content'])
                code_metadata.append({
                    'node_id': node_id,
                    'language': node_data.get('language', 'unknown'),
                    'file_path': node_data.get('file_path'),
                    'function_name': node_data.get('function_name'),
                    'class_name': node_data.get('class_name'),
                    'complexity': node_data.get('complexity_score', 1.0)
                })
        
        # Generate code embeddings using CodeBERT
        code_embeddings = []
        for code in code_documents:
            embedding = await self.generate_code_embedding(code)
            code_embeddings.append(embedding)
        
        if code_embeddings:
            code_embeddings = np.array(code_embeddings)
            
            # Build FAISS index for code
            dimension = code_embeddings.shape[1]
            self.code_index = faiss.IndexFlatIP(dimension)
            self.code_index.add(code_embeddings.astype('float32'))
            
            # Store metadata
            self.code_metadata = code_metadata
        
        return {
            'index_type': 'code',
            'documents_indexed': len(code_documents),
            'embedding_dimension': dimension if code_embeddings else 0,
            'languages_indexed': set(meta['language'] for meta in code_metadata)
        }
    
    async def generate_code_embedding(self, code_content):
        """
        Generate embeddings for code using CodeBERT
        """
        # Tokenize code
        tokens = self.code_tokenizer(
            code_content,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )
        
        # Generate embeddings
        with torch.no_grad():
            outputs = self.code_encoder(**tokens)
            # Use mean pooling of last hidden state
            embedding = outputs.last_hidden_state.mean(dim=1).squeeze()
        
        return embedding.numpy()
    
    async def semantic_search(self, query, search_config=None):
        """
        Perform advanced semantic search across all knowledge modalities
        """
        if search_config is None:
            search_config = {
                'modalities': ['text', 'code', 'multimodal'],
                'max_results': 10,
                'similarity_threshold': 0.7,
                'context_filters': {},
                'rerank_results': True
            }
        
        search_session = {
            'query': query,
            'search_config': search_config,
            'modality_results': {},
            'fused_results': [],
            'search_metadata': {}
        }
        
        # Analyze query to determine optimal search strategy
        query_analysis = await self.analyze_search_query(query)
        search_session['query_analysis'] = query_analysis
        
        # Execute searches across modalities
        search_tasks = []
        
        if 'text' in search_config['modalities']:
            search_tasks.append(self.search_text_modality(query, search_config))
        
        if 'code' in search_config['modalities']:
            search_tasks.append(self.search_code_modality(query, search_config))
        
        if 'multimodal' in search_config['modalities']:
            search_tasks.append(self.search_multimodal_content(query, search_config))
        
        if 'graph' in search_config['modalities']:
            search_tasks.append(self.search_graph_relationships(query, search_config))
        
        # Execute searches in parallel
        modality_results = await asyncio.gather(*search_tasks)
        
        # Combine and fuse results
        fused_results = await self.fuse_search_results(
            modality_results,
            query_analysis,
            search_config
        )
        
        # Apply contextual filtering
        filtered_results = await self.apply_contextual_filters(
            fused_results,
            search_config.get('context_filters', {})
        )
        
        # Rerank results if requested
        if search_config.get('rerank_results', True):
            final_results = await self.rerank_search_results(
                filtered_results,
                query,
                query_analysis
            )
        else:
            final_results = filtered_results
        
        search_session.update({
            'modality_results': {f'modality_{i}': result for i, result in enumerate(modality_results)},
            'fused_results': fused_results,
            'final_results': final_results[:search_config['max_results']],
            'search_metadata': {
                'total_results_before_filtering': len(fused_results),
                'total_results_after_filtering': len(filtered_results),
                'final_result_count': len(final_results[:search_config['max_results']]),
                'search_time': datetime.utcnow()
            }
        })
        
        return search_session
    
    async def search_text_modality(self, query, search_config):
        """
        Search text content using semantic embeddings
        """
        if self.text_index is None:
            return {'results': [], 'modality': 'text', 'error': 'Text index not initialized'}
        
        # Generate query embedding
        query_embedding = self.text_encoder.encode([query])
        
        # Search in FAISS index
        similarities, indices = self.text_index.search(
            query_embedding.astype('float32'),
            min(search_config.get('max_results', 10) * 2, self.text_index.ntotal)
        )
        
        # Build results with metadata
        results = []
        for similarity, idx in zip(similarities[0], indices[0]):
            if similarity >= search_config.get('similarity_threshold', 0.7):
                result = {
                    'content_id': self.text_metadata[idx]['node_id'],
                    'similarity_score': float(similarity),
                    'content_type': 'text',
                    'metadata': self.text_metadata[idx],
                    'modality': 'text'
                }
                results.append(result)
        
        return {
            'results': results,
            'modality': 'text',
            'search_method': 'semantic_embedding',
            'total_candidates': len(indices[0])
        }
    
    async def search_code_modality(self, query, search_config):
        """
        Search code content using specialized code embeddings
        """
        if self.code_index is None:
            return {'results': [], 'modality': 'code', 'error': 'Code index not initialized'}
        
        # Generate query embedding for code search
        query_embedding = await self.generate_code_embedding(query)
        
        # Search in code FAISS index
        similarities, indices = self.code_index.search(
            query_embedding.reshape(1, -1).astype('float32'),
            min(search_config.get('max_results', 10) * 2, self.code_index.ntotal)
        )
        
        # Build results with metadata
        results = []
        for similarity, idx in zip(similarities[0], indices[0]):
            if similarity >= search_config.get('similarity_threshold', 0.7):
                result = {
                    'content_id': self.code_metadata[idx]['node_id'],
                    'similarity_score': float(similarity),
                    'content_type': 'code',
                    'metadata': self.code_metadata[idx],
                    'modality': 'code'
                }
                results.append(result)
        
        return {
            'results': results,
            'modality': 'code',
            'search_method': 'code_semantic_embedding',
            'total_candidates': len(indices[0])
        }
    
    async def analyze_search_query(self, query):
        """
        Analyze search query to determine optimal search strategy
        """
        query_analysis = {
            'query_type': 'general',
            'intent': 'information_retrieval',
            'complexity': 'medium',
            'domains': [],
            'entities': [],
            'temporal_indicators': [],
            'code_indicators': []
        }
        
        # Analyze query characteristics
        query_lower = query.lower()
        
        # Detect query type
        if any(keyword in query_lower for keyword in ['function', 'method', 'class', 'code']):
            query_analysis['query_type'] = 'code'
        elif any(keyword in query_lower for keyword in ['pattern', 'architecture', 'design']):
            query_analysis['query_type'] = 'architectural'
        elif any(keyword in query_lower for keyword in ['how to', 'implement', 'create']):
            query_analysis['query_type'] = 'procedural'
        elif any(keyword in query_lower for keyword in ['similar', 'like', 'related']):
            query_analysis['query_type'] = 'similarity'
        
        # Detect intent
        if any(keyword in query_lower for keyword in ['find', 'search', 'show']):
            query_analysis['intent'] = 'information_retrieval'
        elif any(keyword in query_lower for keyword in ['compare', 'difference', 'versus']):
            query_analysis['intent'] = 'comparison'
        elif any(keyword in query_lower for keyword in ['recommend', 'suggest', 'best']):
            query_analysis['intent'] = 'recommendation'
        elif any(keyword in query_lower for keyword in ['explain', 'understand', 'learn']):
            query_analysis['intent'] = 'explanation'
        
        # Extract entities using NLP
        doc = self.nlp(query)
        query_analysis['entities'] = [ent.text for ent in doc.ents]
        
        # Detect temporal indicators
        temporal_keywords = ['recent', 'latest', 'old', 'previous', 'current', 'new']
        query_analysis['temporal_indicators'] = [word for word in temporal_keywords if word in query_lower]
        
        # Detect code indicators
        code_keywords = ['function', 'method', 'class', 'variable', 'API', 'library', 'framework']
        query_analysis['code_indicators'] = [word for word in code_keywords if word in query_lower]
        
        return query_analysis
    
    async def fuse_search_results(self, modality_results, query_analysis, search_config):
        """
        Fuse results from different search modalities
        """
        all_results = []
        
        # Collect all results
        for modality_result in modality_results:
            if 'results' in modality_result:
                all_results.extend(modality_result['results'])
        
        # Remove duplicates based on content_id
        seen_ids = set()
        unique_results = []
        for result in all_results:
            if result['content_id'] not in seen_ids:
                unique_results.append(result)
                seen_ids.add(result['content_id'])
        
        # Apply fusion scoring
        fused_results = []
        for result in unique_results:
            # Calculate fusion score
            fusion_score = await self.calculate_fusion_score(
                result,
                query_analysis,
                search_config
            )
            
            result['fusion_score'] = fusion_score
            fused_results.append(result)
        
        # Sort by fusion score
        fused_results.sort(key=lambda x: x['fusion_score'], reverse=True)
        
        return fused_results
    
    async def calculate_fusion_score(self, result, query_analysis, search_config):
        """
        Calculate fusion score combining multiple factors
        """
        base_similarity = result['similarity_score']
        
        # Modality bonus based on query type
        modality_bonus = 0.0
        if query_analysis['query_type'] == 'code' and result['modality'] == 'code':
            modality_bonus = 0.2
        elif query_analysis['query_type'] == 'architectural' and result['modality'] == 'text':
            modality_bonus = 0.1
        
        # Recency bonus
        recency_bonus = 0.0
        if 'timestamp' in result['metadata'] and result['metadata']['timestamp']:
            days_old = (datetime.utcnow() - datetime.fromisoformat(result['metadata']['timestamp'])).days
            recency_bonus = max(0, 0.1 - (days_old / 365) * 0.1)  # Decay over time
        
        # Importance bonus
        importance_bonus = result['metadata'].get('importance', 1.0) * 0.05
        
        # Calculate final fusion score
        fusion_score = base_similarity + modality_bonus + recency_bonus + importance_bonus
        
        return min(fusion_score, 1.0)  # Cap at 1.0
```

#### Advanced Search Features
```python
class ContextualSearch:
    """
    Context-aware search that considers project, team, and temporal context
    """
    
    def __init__(self):
        self.context_weights = {
            'project': 0.3,
            'team': 0.2,
            'temporal': 0.2,
            'domain': 0.3
        }
    
    async def contextual_search(self, query, context, knowledge_base):
        """
        Perform search with rich contextual understanding
        """
        contextual_results = {
            'base_search_results': [],
            'context_enhanced_results': [],
            'context_analysis': {},
            'relevance_scoring': {}
        }
        
        # Perform base semantic search
        base_results = await self.base_semantic_search(query, knowledge_base)
        contextual_results['base_search_results'] = base_results
        
        # Analyze context
        context_analysis = await self.analyze_search_context(context)
        contextual_results['context_analysis'] = context_analysis
        
        # Enhance results with context
        enhanced_results = []
        for result in base_results:
            enhanced_result = await self.enhance_result_with_context(
                result,
                context_analysis,
                knowledge_base
            )
            enhanced_results.append(enhanced_result)
        
        # Re-rank based on contextual relevance
        contextually_ranked = await self.rank_by_contextual_relevance(
            enhanced_results,
            context_analysis
        )
        
        contextual_results['context_enhanced_results'] = contextually_ranked
        
        return contextual_results
    
    async def enhance_result_with_context(self, result, context_analysis, knowledge_base):
        """
        Enhance search result with contextual information
        """
        enhanced_result = {
            **result,
            'contextual_relevance': {},
            'context_connections': [],
            'contextual_score': 0.0
        }
        
        # Analyze project context relevance
        if 'project' in context_analysis:
            project_relevance = await self.calculate_project_relevance(
                result,
                context_analysis['project'],
                knowledge_base
            )
            enhanced_result['contextual_relevance']['project'] = project_relevance
        
        # Analyze team context relevance
        if 'team' in context_analysis:
            team_relevance = await self.calculate_team_relevance(
                result,
                context_analysis['team'],
                knowledge_base
            )
            enhanced_result['contextual_relevance']['team'] = team_relevance
        
        # Analyze temporal context relevance
        if 'temporal' in context_analysis:
            temporal_relevance = await self.calculate_temporal_relevance(
                result,
                context_analysis['temporal']
            )
            enhanced_result['contextual_relevance']['temporal'] = temporal_relevance
        
        # Calculate overall contextual score
        contextual_score = 0.0
        for context_type, weight in self.context_weights.items():
            if context_type in enhanced_result['contextual_relevance']:
                contextual_score += enhanced_result['contextual_relevance'][context_type] * weight
        
        enhanced_result['contextual_score'] = contextual_score
        
        return enhanced_result

class HybridSearch:
    """
    Hybrid search combining dense vector search with sparse keyword search
    """
    
    def __init__(self):
        self.dense_weight = 0.7
        self.sparse_weight = 0.3
        self.keyword_index = {}
        
    async def hybrid_search(self, query, knowledge_base, search_config):
        """
        Perform hybrid search combining dense and sparse methods
        """
        hybrid_results = {
            'dense_results': [],
            'sparse_results': [],
            'fused_results': [],
            'fusion_metadata': {}
        }
        
        # Perform dense vector search
        dense_results = await self.dense_vector_search(query, knowledge_base)
        hybrid_results['dense_results'] = dense_results
        
        # Perform sparse keyword search
        sparse_results = await self.sparse_keyword_search(query, knowledge_base)
        hybrid_results['sparse_results'] = sparse_results
        
        # Fuse results using reciprocal rank fusion
        fused_results = await self.reciprocal_rank_fusion(
            dense_results,
            sparse_results,
            search_config
        )
        hybrid_results['fused_results'] = fused_results
        
        return hybrid_results
    
    async def reciprocal_rank_fusion(self, dense_results, sparse_results, search_config):
        """
        Fuse dense and sparse results using reciprocal rank fusion
        """
        k = search_config.get('rrf_k', 60)  # RRF parameter
        
        # Create unified result set
        all_results = {}
        
        # Add dense results with RRF scoring
        for rank, result in enumerate(dense_results, 1):
            content_id = result['content_id']
            rrf_score = 1.0 / (k + rank)
            
            if content_id in all_results:
                all_results[content_id]['rrf_score'] += self.dense_weight * rrf_score
            else:
                all_results[content_id] = {
                    **result,
                    'rrf_score': self.dense_weight * rrf_score,
                    'dense_rank': rank,
                    'sparse_rank': None
                }
        
        # Add sparse results with RRF scoring
        for rank, result in enumerate(sparse_results, 1):
            content_id = result['content_id']
            rrf_score = 1.0 / (k + rank)
            
            if content_id in all_results:
                all_results[content_id]['rrf_score'] += self.sparse_weight * rrf_score
                all_results[content_id]['sparse_rank'] = rank
            else:
                all_results[content_id] = {
                    **result,
                    'rrf_score': self.sparse_weight * rrf_score,
                    'dense_rank': None,
                    'sparse_rank': rank
                }
        
        # Sort by RRF score
        fused_results = sorted(
            all_results.values(),
            key=lambda x: x['rrf_score'],
            reverse=True
        )
        
        return fused_results
```

### Search Engine Commands

```bash
# Basic semantic search
bmad search --query "authentication patterns for microservices"
bmad search --code "function getUserProfile" --language "javascript"
bmad search --semantic "caching strategies" --context "high-performance"

# Advanced search options
bmad search --hybrid "database connection pooling" --modalities "text,code"
bmad search --contextual "error handling" --project-context "current"
bmad search --graph-search "relationships between Auth and Database"

# Search configuration and optimization
bmad search config --similarity-threshold 0.8 --max-results 20
bmad search index --rebuild --include-recent-changes
bmad search analyze --query-performance --optimization-suggestions

# Search result management
bmad search export --results "last-search" --format "json"
bmad search feedback --result-id "uuid" --relevance-score 0.9
bmad search history --show-patterns --time-period "last-week"
```

This Semantic Search Engine provides sophisticated, multi-modal search capabilities that understand context, intent, and semantic relationships, enabling developers to find relevant knowledge quickly and accurately across all domains of their development activities.