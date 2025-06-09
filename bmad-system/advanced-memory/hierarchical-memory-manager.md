# Hierarchical Memory Manager

## Advanced Memory Architecture for Enhanced BMAD System

The Hierarchical Memory Manager provides sophisticated, multi-tiered memory management with intelligent retention, compression, and retrieval capabilities that scale from individual sessions to enterprise-wide knowledge repositories.

### Hierarchical Memory Architecture

#### Multi-Tier Memory Structure
```yaml
hierarchical_memory_architecture:
  memory_tiers:
    immediate_memory:
      - working_memory: "Current session active context"
      - attention_buffer: "Recently accessed high-priority items"
      - rapid_access_cache: "Ultra-fast access for current operations"
      - conversation_buffer: "Current conversation context"
      
    short_term_memory:
      - session_memory: "Complete session knowledge and context"
      - recent_patterns: "Recently identified patterns and insights"
      - active_decisions: "Ongoing decision processes"
      - current_objectives: "Session goals and progress tracking"
      
    medium_term_memory:
      - project_memory: "Project-specific knowledge and history"
      - team_memory: "Team collaboration patterns and knowledge"
      - sprint_memory: "Development cycle knowledge"
      - contextual_memory: "Situational knowledge and adaptations"
      
    long_term_memory:
      - organizational_memory: "Enterprise-wide knowledge repository"
      - domain_memory: "Technical domain expertise and patterns"
      - historical_memory: "Long-term trends and evolution"
      - strategic_memory: "High-level strategic decisions and outcomes"
      
    permanent_memory:
      - core_knowledge: "Fundamental principles and established facts"
      - validated_patterns: "Thoroughly validated successful patterns"
      - canonical_solutions: "Proven solution templates and frameworks"
      - institutional_knowledge: "Critical organizational knowledge"
      
  memory_characteristics:
    retention_policies:
      - importance_based: "Retain based on knowledge importance scores"
      - access_frequency: "Retain frequently accessed memories"
      - recency_weighted: "Weight recent memories higher"
      - validation_status: "Prioritize validated knowledge"
      
    compression_strategies:
      - semantic_compression: "Compress while preserving meaning"
      - pattern_abstraction: "Abstract specific instances to patterns"
      - hierarchical_summarization: "Multi-level summary creation"
      - lossy_compression: "Remove less important details"
      
    retrieval_optimization:
      - predictive_preloading: "Preload likely needed memories"
      - contextual_indexing: "Index by multiple context dimensions"
      - associative_linking: "Link related memories"
      - temporal_organization: "Organize by time relationships"
      
    conflict_resolution:
      - confidence_scoring: "Resolve based on confidence levels"
      - source_credibility: "Weight by information source reliability"
      - consensus_analysis: "Use multiple source agreement"
      - temporal_precedence: "Newer information supersedes older"
```

#### Advanced Memory Manager Implementation
```python
import asyncio
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import networkx as nx
from collections import defaultdict, deque
import pickle
import lz4
import zstandard as zstd
from datetime import datetime, timedelta
import heapq
from typing import Dict, List, Any, Optional, Tuple

class HierarchicalMemoryManager:
    """
    Advanced hierarchical memory management system with intelligent retention and retrieval
    """
    
    def __init__(self, config=None):
        self.config = config or {
            'immediate_memory_size': 1000,
            'short_term_memory_size': 10000,
            'medium_term_memory_size': 100000,
            'compression_threshold': 0.8,
            'importance_threshold': 0.7,
            'retention_period_days': {
                'immediate': 1,
                'short_term': 7,
                'medium_term': 90,
                'long_term': 365
            }
        }
        
        # Initialize memory tiers
        self.immediate_memory = ImmediateMemory(self.config)
        self.short_term_memory = ShortTermMemory(self.config)
        self.medium_term_memory = MediumTermMemory(self.config)
        self.long_term_memory = LongTermMemory(self.config)
        self.permanent_memory = PermanentMemory(self.config)
        
        # Memory management components
        self.importance_scorer = ImportanceScorer()
        self.compression_engine = CompressionEngine()
        self.retrieval_optimizer = RetrievalOptimizer()
        self.conflict_resolver = ConflictResolver()
        self.retention_policy = RetentionPolicyManager(self.config)
        
        # Memory analytics
        self.memory_analytics = MemoryAnalytics()
        self.access_patterns = AccessPatternTracker()
        
    async def store_memory(self, memory_item, context=None):
        """
        Store memory item in appropriate tier based on characteristics and importance
        """
        storage_session = {
            'memory_id': memory_item.get('id', generate_uuid()),
            'storage_tier': None,
            'importance_score': 0.0,
            'compression_applied': False,
            'conflicts_resolved': [],
            'storage_metadata': {}
        }
        
        # Calculate importance score
        importance_score = await self.importance_scorer.calculate_importance(
            memory_item,
            context
        )
        storage_session['importance_score'] = importance_score
        
        # Determine appropriate storage tier
        storage_tier = await self.determine_storage_tier(memory_item, importance_score, context)
        storage_session['storage_tier'] = storage_tier
        
        # Check for conflicts with existing memories
        conflicts = await self.conflict_resolver.detect_conflicts(memory_item, storage_tier)
        if conflicts:
            resolution_results = await self.conflict_resolver.resolve_conflicts(
                memory_item,
                conflicts,
                storage_tier
            )
            storage_session['conflicts_resolved'] = resolution_results
        
        # Apply compression if needed
        if await self.should_compress_memory(memory_item, storage_tier):
            compressed_item = await self.compression_engine.compress_memory(memory_item)
            memory_item = compressed_item
            storage_session['compression_applied'] = True
        
        # Store in appropriate tier
        if storage_tier == 'immediate':
            storage_result = await self.immediate_memory.store(memory_item, context)
        elif storage_tier == 'short_term':
            storage_result = await self.short_term_memory.store(memory_item, context)
        elif storage_tier == 'medium_term':
            storage_result = await self.medium_term_memory.store(memory_item, context)
        elif storage_tier == 'long_term':
            storage_result = await self.long_term_memory.store(memory_item, context)
        elif storage_tier == 'permanent':
            storage_result = await self.permanent_memory.store(memory_item, context)
        
        storage_session['storage_metadata'] = storage_result
        
        # Update access patterns
        await self.access_patterns.record_storage(memory_item, storage_tier, context)
        
        # Trigger memory maintenance if needed
        await self.trigger_memory_maintenance_if_needed()
        
        return storage_session
    
    async def retrieve_memory(self, query, context=None, retrieval_config=None):
        """
        Intelligent memory retrieval across all tiers with optimization
        """
        if retrieval_config is None:
            retrieval_config = {
                'max_results': 10,
                'similarity_threshold': 0.7,
                'include_compressed': True,
                'cross_tier_search': True,
                'temporal_weighting': True
            }
        
        retrieval_session = {
            'query': query,
            'context': context,
            'tier_results': {},
            'fused_results': [],
            'retrieval_metadata': {}
        }
        
        # Optimize retrieval strategy based on query and context
        retrieval_strategy = await self.retrieval_optimizer.optimize_retrieval_strategy(
            query,
            context,
            retrieval_config
        )
        
        # Execute retrieval across tiers based on strategy
        retrieval_tasks = []
        
        if retrieval_strategy['search_immediate']:
            retrieval_tasks.append(
                self.retrieve_from_tier('immediate', query, context, retrieval_config)
            )
        
        if retrieval_strategy['search_short_term']:
            retrieval_tasks.append(
                self.retrieve_from_tier('short_term', query, context, retrieval_config)
            )
        
        if retrieval_strategy['search_medium_term']:
            retrieval_tasks.append(
                self.retrieve_from_tier('medium_term', query, context, retrieval_config)
            )
        
        if retrieval_strategy['search_long_term']:
            retrieval_tasks.append(
                self.retrieve_from_tier('long_term', query, context, retrieval_config)
            )
        
        if retrieval_strategy['search_permanent']:
            retrieval_tasks.append(
                self.retrieve_from_tier('permanent', query, context, retrieval_config)
            )
        
        # Execute retrievals in parallel
        tier_results = await asyncio.gather(*retrieval_tasks)
        
        # Store tier results
        tier_names = ['immediate', 'short_term', 'medium_term', 'long_term', 'permanent']
        for i, result in enumerate(tier_results):
            if i < len(tier_names):
                retrieval_session['tier_results'][tier_names[i]] = result
        
        # Fuse results across tiers
        fused_results = await self.fuse_cross_tier_results(
            tier_results,
            query,
            context,
            retrieval_config
        )
        retrieval_session['fused_results'] = fused_results
        
        # Update access patterns
        await self.access_patterns.record_retrieval(query, fused_results, context)
        
        # Update memory importance based on access
        await self.update_memory_importance_from_access(fused_results)
        
        return retrieval_session
    
    async def determine_storage_tier(self, memory_item, importance_score, context):
        """
        Determine the appropriate storage tier for a memory item
        """
        # Immediate memory criteria
        if (context and context.get('session_active', True) and 
            importance_score > 0.8 and
            memory_item.get('type') in ['current_task', 'active_decision', 'working_context']):
            return 'immediate'
        
        # Short-term memory criteria
        elif (importance_score > 0.6 and
              memory_item.get('age_hours', 0) < 24 and
              memory_item.get('type') in ['session_memory', 'recent_pattern', 'active_objective']):
            return 'short_term'
        
        # Medium-term memory criteria
        elif (importance_score > 0.4 and
              memory_item.get('age_days', 0) < 30 and
              memory_item.get('type') in ['project_memory', 'team_knowledge', 'sprint_outcome']):
            return 'medium_term'
        
        # Long-term memory criteria
        elif (importance_score > 0.3 and
              memory_item.get('validated', False) and
              memory_item.get('type') in ['organizational_knowledge', 'domain_expertise']):
            return 'long_term'
        
        # Permanent memory criteria
        elif (importance_score > 0.7 and
              memory_item.get('validated', False) and
              memory_item.get('consensus_score', 0) > 0.8 and
              memory_item.get('type') in ['core_principle', 'validated_pattern', 'canonical_solution']):
            return 'permanent'
        
        # Default to short-term for new items
        else:
            return 'short_term'
    
    async def memory_maintenance_cycle(self):
        """
        Periodic memory maintenance including compression, migration, and cleanup
        """
        maintenance_session = {
            'session_id': generate_uuid(),
            'start_time': datetime.utcnow(),
            'maintenance_actions': [],
            'performance_improvements': {},
            'space_reclaimed': 0
        }
        
        # Immediate memory maintenance
        immediate_maintenance = await self.maintain_immediate_memory()
        maintenance_session['maintenance_actions'].append(immediate_maintenance)
        
        # Short-term memory maintenance
        short_term_maintenance = await self.maintain_short_term_memory()
        maintenance_session['maintenance_actions'].append(short_term_maintenance)
        
        # Medium-term memory maintenance
        medium_term_maintenance = await self.maintain_medium_term_memory()
        maintenance_session['maintenance_actions'].append(medium_term_maintenance)
        
        # Long-term memory optimization
        long_term_optimization = await self.optimize_long_term_memory()
        maintenance_session['maintenance_actions'].append(long_term_optimization)
        
        # Cross-tier memory migration
        migration_results = await self.execute_cross_tier_migration()
        maintenance_session['maintenance_actions'].append(migration_results)
        
        # Memory compression optimization
        compression_optimization = await self.optimize_memory_compression()
        maintenance_session['maintenance_actions'].append(compression_optimization)
        
        # Calculate performance improvements
        performance_improvements = await self.calculate_maintenance_improvements(
            maintenance_session['maintenance_actions']
        )
        maintenance_session['performance_improvements'] = performance_improvements
        
        maintenance_session['end_time'] = datetime.utcnow()
        maintenance_session['duration'] = (
            maintenance_session['end_time'] - maintenance_session['start_time']
        ).total_seconds()
        
        return maintenance_session
    
    async def maintain_immediate_memory(self):
        """
        Maintain immediate memory by promoting important items and evicting stale ones
        """
        maintenance_result = {
            'memory_tier': 'immediate',
            'items_processed': 0,
            'items_promoted': 0,
            'items_evicted': 0,
            'space_reclaimed': 0
        }
        
        # Get all items from immediate memory
        immediate_items = await self.immediate_memory.get_all_items()
        maintenance_result['items_processed'] = len(immediate_items)
        
        # Evaluate each item for promotion or eviction
        for item in immediate_items:
            # Check if item should be promoted to short-term memory
            if await self.should_promote_to_short_term(item):
                await self.immediate_memory.remove(item['id'])
                await self.short_term_memory.store(item)
                maintenance_result['items_promoted'] += 1
            
            # Check if item should be evicted due to age or low importance
            elif await self.should_evict_from_immediate(item):
                space_before = await self.immediate_memory.get_space_usage()
                await self.immediate_memory.remove(item['id'])
                space_after = await self.immediate_memory.get_space_usage()
                maintenance_result['space_reclaimed'] += space_before - space_after
                maintenance_result['items_evicted'] += 1
        
        return maintenance_result
    
    async def execute_cross_tier_migration(self):
        """
        Migrate memories between tiers based on access patterns and importance
        """
        migration_result = {
            'migration_type': 'cross_tier',
            'migrations_executed': [],
            'total_items_migrated': 0,
            'performance_impact': {}
        }
        
        # Analyze access patterns to identify migration candidates
        migration_candidates = await self.identify_migration_candidates()
        
        for candidate in migration_candidates:
            source_tier = candidate['current_tier']
            target_tier = candidate['recommended_tier']
            item_id = candidate['item_id']
            
            # Execute migration
            migration_success = await self.migrate_memory_item(
                item_id,
                source_tier,
                target_tier
            )
            
            if migration_success:
                migration_result['migrations_executed'].append({
                    'item_id': item_id,
                    'source_tier': source_tier,
                    'target_tier': target_tier,
                    'migration_reason': candidate['reason'],
                    'expected_benefit': candidate['expected_benefit']
                })
                migration_result['total_items_migrated'] += 1
        
        return migration_result

class ImportanceScorer:
    """
    Calculate importance scores for memory items based on multiple factors
    """
    
    def __init__(self):
        self.scoring_weights = {
            'recency': 0.2,
            'frequency': 0.25,
            'context_relevance': 0.2,
            'validation_level': 0.15,
            'uniqueness': 0.1,
            'user_feedback': 0.1
        }
    
    async def calculate_importance(self, memory_item, context=None):
        """
        Calculate comprehensive importance score for memory item
        """
        importance_components = {
            'recency_score': await self.calculate_recency_score(memory_item),
            'frequency_score': await self.calculate_frequency_score(memory_item),
            'context_relevance_score': await self.calculate_context_relevance(memory_item, context),
            'validation_score': await self.calculate_validation_score(memory_item),
            'uniqueness_score': await self.calculate_uniqueness_score(memory_item),
            'user_feedback_score': await self.calculate_user_feedback_score(memory_item)
        }
        
        # Calculate weighted importance score
        importance_score = 0.0
        for component, weight in self.scoring_weights.items():
            component_key = f"{component.replace('_', '_')}_score"
            if component_key in importance_components:
                importance_score += importance_components[component_key] * weight
        
        # Normalize to 0-1 range
        importance_score = max(0.0, min(1.0, importance_score))
        
        return {
            'overall_score': importance_score,
            'components': importance_components,
            'calculation_timestamp': datetime.utcnow()
        }
    
    async def calculate_recency_score(self, memory_item):
        """
        Calculate recency score based on when memory was created/last accessed
        """
        timestamp = memory_item.get('timestamp')
        if not timestamp:
            return 0.5  # Default for items without timestamp
        
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        time_diff = datetime.utcnow() - timestamp
        days_old = time_diff.total_seconds() / (24 * 3600)
        
        # Exponential decay: score = e^(-days_old/decay_constant)
        decay_constant = 30  # 30 days
        recency_score = np.exp(-days_old / decay_constant)
        
        return min(1.0, recency_score)
    
    async def calculate_frequency_score(self, memory_item):
        """
        Calculate frequency score based on access patterns
        """
        access_count = memory_item.get('access_count', 0)
        last_access = memory_item.get('last_access')
        
        if access_count == 0:
            return 0.1  # Minimum score for unaccessed items
        
        # Calculate frequency adjusted for recency
        if last_access:
            if isinstance(last_access, str):
                last_access = datetime.fromisoformat(last_access)
            
            days_since_access = (datetime.utcnow() - last_access).days
            recency_factor = max(0.1, 1.0 - (days_since_access / 365))  # Decay over a year
        else:
            recency_factor = 0.5
        
        # Logarithmic scaling for access count
        frequency_base = min(1.0, np.log(access_count + 1) / np.log(100))  # Max out at 100 accesses
        
        return frequency_base * recency_factor

class CompressionEngine:
    """
    Intelligent memory compression while preserving semantic content
    """
    
    def __init__(self):
        self.compression_algorithms = {
            'lossless': LosslessCompression(),
            'semantic': SemanticCompression(),
            'pattern_based': PatternBasedCompression(),
            'hierarchical': HierarchicalCompression()
        }
        
        self.compression_thresholds = {
            'size_threshold_mb': 1.0,
            'age_threshold_days': 7,
            'access_frequency_threshold': 0.1
        }
    
    async def compress_memory(self, memory_item, compression_strategy='auto'):
        """
        Compress memory item using appropriate strategy
        """
        if compression_strategy == 'auto':
            compression_strategy = await self.select_compression_strategy(memory_item)
        
        compression_algorithm = self.compression_algorithms.get(
            compression_strategy,
            self.compression_algorithms['lossless']
        )
        
        compressed_result = await compression_algorithm.compress(memory_item)
        
        return {
            **memory_item,
            'compressed': True,
            'compression_strategy': compression_strategy,
            'compression_ratio': compressed_result['compression_ratio'],
            'compressed_data': compressed_result['compressed_data'],
            'compression_metadata': compressed_result['metadata'],
            'original_size': compressed_result['original_size'],
            'compressed_size': compressed_result['compressed_size']
        }
    
    async def decompress_memory(self, compressed_memory_item):
        """
        Decompress memory item to restore original content
        """
        compression_strategy = compressed_memory_item.get('compression_strategy', 'lossless')
        compression_algorithm = self.compression_algorithms.get(compression_strategy)
        
        if not compression_algorithm:
            raise ValueError(f"Unknown compression strategy: {compression_strategy}")
        
        decompressed_result = await compression_algorithm.decompress(compressed_memory_item)
        
        # Restore original memory item structure
        decompressed_item = {
            **compressed_memory_item,
            'compressed': False,
            **decompressed_result['restored_data']
        }
        
        # Remove compression-specific fields
        compression_fields = [
            'compression_strategy', 'compression_ratio', 'compressed_data',
            'compression_metadata', 'original_size', 'compressed_size'
        ]
        for field in compression_fields:
            decompressed_item.pop(field, None)
        
        return decompressed_item

class LosslessCompression:
    """
    Lossless compression using advanced algorithms
    """
    
    async def compress(self, memory_item):
        """
        Apply lossless compression to memory item
        """
        # Serialize memory item
        serialized_data = pickle.dumps(memory_item)
        original_size = len(serialized_data)
        
        # Apply Zstandard compression for best ratio
        compressor = zstd.ZstdCompressor(level=19)  # Maximum compression
        compressed_data = compressor.compress(serialized_data)
        compressed_size = len(compressed_data)
        
        compression_ratio = original_size / compressed_size if compressed_size > 0 else 1.0
        
        return {
            'compressed_data': compressed_data,
            'compression_ratio': compression_ratio,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'metadata': {
                'algorithm': 'zstandard',
                'compression_level': 19,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
    
    async def decompress(self, compressed_memory_item):
        """
        Decompress losslessly compressed memory item
        """
        compressed_data = compressed_memory_item['compressed_data']
        
        # Decompress using Zstandard
        decompressor = zstd.ZstdDecompressor()
        decompressed_data = decompressor.decompress(compressed_data)
        
        # Deserialize back to original structure
        restored_data = pickle.loads(decompressed_data)
        
        return {
            'restored_data': restored_data,
            'decompression_successful': True
        }
```

### Advanced Memory Commands

```bash
# Memory tier management
bmad memory status --tiers "all" --usage-statistics
bmad memory migrate --item-id "uuid" --from "short_term" --to "long_term"
bmad memory compress --tier "medium_term" --algorithm "semantic"

# Memory maintenance and optimization
bmad memory maintenance --run-cycle --optimize-performance
bmad memory cleanup --tier "immediate" --age-threshold "24h"
bmad memory defragment --all-tiers --compact-storage

# Memory analytics and insights
bmad memory analyze --access-patterns --time-window "30d"
bmad memory importance --recalculate --update-tiers
bmad memory conflicts --detect --resolve-automatically

# Memory retrieval optimization
bmad memory search --query "authentication patterns" --cross-tier
bmad memory preload --predict-usage --context "current-session"
bmad memory export --tier "permanent" --format "knowledge-graph"
```

This Hierarchical Memory Manager provides enterprise-grade memory management with intelligent tiering, compression, and optimization capabilities that scale from individual sessions to organizational knowledge repositories.