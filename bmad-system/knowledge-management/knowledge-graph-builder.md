# Knowledge Graph Builder

## Advanced Knowledge Graph Construction for Enhanced BMAD System

The Knowledge Graph Builder creates comprehensive, interconnected knowledge representations that capture relationships between code, concepts, patterns, decisions, and outcomes across all development activities.

### Knowledge Graph Architecture

#### Multi-Dimensional Knowledge Representation
```yaml
knowledge_graph_structure:
  node_types:
    concept_nodes:
      - code_concepts: "Functions, classes, modules, patterns"
      - domain_concepts: "Business logic, requirements, features"
      - technical_concepts: "Architectures, technologies, frameworks"
      - process_concepts: "Workflows, methodologies, practices"
      - team_concepts: "Roles, skills, collaboration patterns"
      
    artifact_nodes:
      - code_artifacts: "Files, components, libraries, APIs"
      - documentation_artifacts: "READMEs, specs, comments"
      - decision_artifacts: "ADRs, meeting notes, rationale"
      - test_artifacts: "Test cases, scenarios, coverage data"
      - deployment_artifacts: "Configs, scripts, environments"
      
    relationship_nodes:
      - dependency_relationships: "Uses, imports, calls, inherits"
      - semantic_relationships: "Similar to, implements, abstracts"
      - temporal_relationships: "Before, after, during, triggers"
      - causality_relationships: "Causes, prevents, enables, blocks"
      - collaboration_relationships: "Authored by, reviewed by, approved by"
      
    context_nodes:
      - project_contexts: "Project phases, milestones, goals"
      - team_contexts: "Team structure, skills, availability"
      - technical_contexts: "Environment, constraints, limitations"
      - business_contexts: "Requirements, priorities, deadlines"
      - quality_contexts: "Standards, criteria, metrics"
      
  edge_types:
    structural_edges:
      - composition: "Part of, contains, includes"
      - inheritance: "Extends, implements, derives from"
      - association: "Uses, references, calls"
      - aggregation: "Composed of, made from, built with"
      
    semantic_edges:
      - similarity: "Similar to, related to, analogous to"
      - classification: "Type of, instance of, category of"
      - transformation: "Converts to, maps to, becomes"
      - equivalence: "Same as, alias for, identical to"
      
    temporal_edges:
      - sequence: "Followed by, preceded by, concurrent with"
      - causality: "Causes, results in, leads to"
      - lifecycle: "Created, modified, deprecated, removed"
      - versioning: "Previous version, next version, variant of"
      
    contextual_edges:
      - applicability: "Used in, applies to, relevant for"
      - constraint: "Requires, depends on, limited by"
      - optimization: "Improves, enhances, optimizes"
      - conflict: "Conflicts with, incompatible with, blocks"
```

#### Knowledge Graph Construction Engine
```python
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from transformers import AutoTokenizer, AutoModel
import torch

class KnowledgeGraphBuilder:
    """
    Advanced knowledge graph construction for development activities
    """
    
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.nlp = spacy.load("en_core_web_sm")
        self.embedder = AutoModel.from_pretrained("microsoft/codebert-base")
        self.tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        
        # Initialize knowledge extractors
        self.code_extractor = CodeKnowledgeExtractor()
        self.conversation_extractor = ConversationKnowledgeExtractor()
        self.decision_extractor = DecisionKnowledgeExtractor()
        self.pattern_extractor = PatternKnowledgeExtractor()
        
    async def build_knowledge_graph(self, data_sources):
        """
        Build comprehensive knowledge graph from multiple data sources
        """
        construction_session = {
            'session_id': generate_uuid(),
            'data_sources': data_sources,
            'extraction_results': {},
            'graph_statistics': {},
            'quality_metrics': {}
        }
        
        # Extract knowledge from different sources
        for source_type, source_data in data_sources.items():
            if source_type == 'codebase':
                extraction_result = await self.extract_code_knowledge(source_data)
            elif source_type == 'conversations':
                extraction_result = await self.extract_conversation_knowledge(source_data)
            elif source_type == 'documentation':
                extraction_result = await self.extract_documentation_knowledge(source_data)
            elif source_type == 'decisions':
                extraction_result = await self.extract_decision_knowledge(source_data)
            elif source_type == 'patterns':
                extraction_result = await self.extract_pattern_knowledge(source_data)
            else:
                extraction_result = await self.extract_generic_knowledge(source_data)
            
            construction_session['extraction_results'][source_type] = extraction_result
            
            # Add extracted knowledge to graph
            await self.integrate_knowledge_into_graph(extraction_result)
        
        # Build relationships between knowledge nodes
        await self.construct_knowledge_relationships()
        
        # Validate and optimize graph structure
        graph_validation = await self.validate_knowledge_graph()
        construction_session['quality_metrics'] = graph_validation
        
        # Generate graph statistics
        construction_session['graph_statistics'] = await self.generate_graph_statistics()
        
        return construction_session
    
    async def extract_code_knowledge(self, codebase_data):
        """
        Extract knowledge from codebase using AST analysis and semantic understanding
        """
        code_knowledge = {
            'functions': [],
            'classes': [],
            'modules': [],
            'dependencies': [],
            'patterns': [],
            'relationships': []
        }
        
        for file_path, file_content in codebase_data.items():
            # Parse code using AST
            ast_analysis = await self.code_extractor.parse_code_ast(file_content, file_path)
            
            # Extract semantic embeddings
            code_embeddings = await self.generate_code_embeddings(file_content)
            
            # Identify code entities
            entities = await self.code_extractor.identify_code_entities(ast_analysis)
            
            # Extract patterns
            patterns = await self.code_extractor.extract_code_patterns(ast_analysis)
            
            # Build dependency graph
            dependencies = await self.code_extractor.extract_dependencies(ast_analysis)
            
            code_knowledge['functions'].extend(entities['functions'])
            code_knowledge['classes'].extend(entities['classes'])
            code_knowledge['modules'].append({
                'path': file_path,
                'content': file_content,
                'embeddings': code_embeddings,
                'ast': ast_analysis
            })
            code_knowledge['dependencies'].extend(dependencies)
            code_knowledge['patterns'].extend(patterns)
        
        # Analyze cross-file relationships
        cross_file_relationships = await self.analyze_cross_file_relationships(code_knowledge)
        code_knowledge['relationships'] = cross_file_relationships
        
        return code_knowledge
    
    async def extract_conversation_knowledge(self, conversation_data):
        """
        Extract knowledge from development conversations and discussions
        """
        conversation_knowledge = {
            'concepts_discussed': [],
            'decisions_made': [],
            'problems_identified': [],
            'solutions_proposed': [],
            'consensus_reached': [],
            'action_items': []
        }
        
        for conversation in conversation_data:
            # Extract key concepts using NLP
            concepts = await self.conversation_extractor.extract_concepts(conversation)
            
            # Identify decision points
            decisions = await self.conversation_extractor.identify_decisions(conversation)
            
            # Extract problems and solutions
            problem_solution_pairs = await self.conversation_extractor.extract_problem_solutions(conversation)
            
            # Identify consensus and disagreements
            consensus_analysis = await self.conversation_extractor.analyze_consensus(conversation)
            
            # Extract actionable items
            action_items = await self.conversation_extractor.extract_action_items(conversation)
            
            conversation_knowledge['concepts_discussed'].extend(concepts)
            conversation_knowledge['decisions_made'].extend(decisions)
            conversation_knowledge['problems_identified'].extend(problem_solution_pairs['problems'])
            conversation_knowledge['solutions_proposed'].extend(problem_solution_pairs['solutions'])
            conversation_knowledge['consensus_reached'].extend(consensus_analysis['consensus'])
            conversation_knowledge['action_items'].extend(action_items)
        
        return conversation_knowledge
    
    async def construct_knowledge_relationships(self):
        """
        Build sophisticated relationships between knowledge nodes
        """
        relationship_types = [
            'semantic_similarity',
            'functional_dependency',
            'temporal_sequence',
            'causal_relationship',
            'compositional_relationship',
            'collaborative_relationship'
        ]
        
        relationship_results = {}
        
        for relationship_type in relationship_types:
            if relationship_type == 'semantic_similarity':
                relationships = await self.build_semantic_relationships()
            elif relationship_type == 'functional_dependency':
                relationships = await self.build_functional_dependencies()
            elif relationship_type == 'temporal_sequence':
                relationships = await self.build_temporal_relationships()
            elif relationship_type == 'causal_relationship':
                relationships = await self.build_causal_relationships()
            elif relationship_type == 'compositional_relationship':
                relationships = await self.build_compositional_relationships()
            elif relationship_type == 'collaborative_relationship':
                relationships = await self.build_collaborative_relationships()
            
            relationship_results[relationship_type] = relationships
            
            # Add relationships to graph
            for relationship in relationships:
                self.graph.add_edge(
                    relationship['source'],
                    relationship['target'],
                    relationship_type=relationship_type,
                    weight=relationship['strength'],
                    metadata=relationship['metadata']
                )
        
        return relationship_results
    
    async def build_semantic_relationships(self):
        """
        Build relationships based on semantic similarity
        """
        semantic_relationships = []
        
        # Get all nodes with textual content
        text_nodes = [node for node, data in self.graph.nodes(data=True) 
                     if 'text_content' in data]
        
        # Generate embeddings for all text content
        embeddings = {}
        for node in text_nodes:
            text_content = self.graph.nodes[node]['text_content']
            embedding = await self.generate_text_embeddings(text_content)
            embeddings[node] = embedding
        
        # Calculate pairwise similarities
        for i, node1 in enumerate(text_nodes):
            for node2 in text_nodes[i+1:]:
                similarity = cosine_similarity(
                    embeddings[node1].reshape(1, -1),
                    embeddings[node2].reshape(1, -1)
                )[0][0]
                
                if similarity > 0.7:  # High similarity threshold
                    semantic_relationships.append({
                        'source': node1,
                        'target': node2,
                        'strength': similarity,
                        'metadata': {
                            'similarity_score': similarity,
                            'relationship_basis': 'semantic_content'
                        }
                    })
        
        return semantic_relationships
    
    async def generate_code_embeddings(self, code_content):
        """
        Generate embeddings for code content using CodeBERT
        """
        # Tokenize code
        tokens = self.tokenizer(
            code_content,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )
        
        # Generate embeddings
        with torch.no_grad():
            outputs = self.embedder(**tokens)
            embeddings = outputs.last_hidden_state.mean(dim=1).squeeze()
        
        return embeddings.numpy()
    
    async def generate_text_embeddings(self, text_content):
        """
        Generate embeddings for natural language text
        """
        # Use TF-IDF for text embeddings (can be replaced with more advanced models)
        tfidf_matrix = self.vectorizer.fit_transform([text_content])
        return tfidf_matrix.toarray()[0]
```

#### Knowledge Quality Assessment
```python
class KnowledgeQualityAssessor:
    """
    Assess and maintain quality of knowledge in the graph
    """
    
    def __init__(self):
        self.quality_metrics = {}
        self.validation_rules = {}
        self.quality_thresholds = {
            'completeness': 0.8,
            'consistency': 0.9,
            'accuracy': 0.85,
            'currency': 0.7,
            'relevance': 0.75
        }
    
    async def assess_knowledge_quality(self, knowledge_graph):
        """
        Comprehensive quality assessment of knowledge graph
        """
        quality_assessment = {
            'overall_score': 0.0,
            'dimension_scores': {},
            'quality_issues': [],
            'improvement_recommendations': []
        }
        
        # Assess different quality dimensions
        dimension_assessments = {}
        
        # Completeness - how complete is the knowledge
        completeness_score = await self.assess_completeness(knowledge_graph)
        dimension_assessments['completeness'] = completeness_score
        
        # Consistency - how consistent is the knowledge
        consistency_score = await self.assess_consistency(knowledge_graph)
        dimension_assessments['consistency'] = consistency_score
        
        # Accuracy - how accurate is the knowledge
        accuracy_score = await self.assess_accuracy(knowledge_graph)
        dimension_assessments['accuracy'] = accuracy_score
        
        # Currency - how up-to-date is the knowledge
        currency_score = await self.assess_currency(knowledge_graph)
        dimension_assessments['currency'] = currency_score
        
        # Relevance - how relevant is the knowledge
        relevance_score = await self.assess_relevance(knowledge_graph)
        dimension_assessments['relevance'] = relevance_score
        
        # Calculate overall quality score
        overall_score = sum(dimension_assessments.values()) / len(dimension_assessments)
        
        quality_assessment.update({
            'overall_score': overall_score,
            'dimension_scores': dimension_assessments,
            'quality_issues': await self.identify_quality_issues(dimension_assessments),
            'improvement_recommendations': await self.generate_improvement_recommendations(dimension_assessments)
        })
        
        return quality_assessment
    
    async def assess_completeness(self, knowledge_graph):
        """
        Assess how complete the knowledge representation is
        """
        completeness_metrics = {
            'node_coverage': 0.0,
            'relationship_coverage': 0.0,
            'domain_coverage': 0.0,
            'temporal_coverage': 0.0
        }
        
        # Analyze node coverage
        total_nodes = knowledge_graph.number_of_nodes()
        nodes_with_complete_data = sum(1 for node, data in knowledge_graph.nodes(data=True) 
                                     if self.is_node_complete(data))
        completeness_metrics['node_coverage'] = nodes_with_complete_data / total_nodes if total_nodes > 0 else 0
        
        # Analyze relationship coverage
        total_possible_relationships = total_nodes * (total_nodes - 1)  # Directed graph
        actual_relationships = knowledge_graph.number_of_edges()
        completeness_metrics['relationship_coverage'] = min(actual_relationships / total_possible_relationships, 1.0) if total_possible_relationships > 0 else 0
        
        # Analyze domain coverage
        domains_represented = set(data.get('domain', 'unknown') for node, data in knowledge_graph.nodes(data=True))
        expected_domains = {'code', 'architecture', 'business', 'process', 'team'}
        completeness_metrics['domain_coverage'] = len(domains_represented.intersection(expected_domains)) / len(expected_domains)
        
        # Analyze temporal coverage
        nodes_with_timestamps = sum(1 for node, data in knowledge_graph.nodes(data=True) 
                                  if 'timestamp' in data)
        completeness_metrics['temporal_coverage'] = nodes_with_timestamps / total_nodes if total_nodes > 0 else 0
        
        return sum(completeness_metrics.values()) / len(completeness_metrics)
    
    async def assess_consistency(self, knowledge_graph):
        """
        Assess consistency of knowledge representation
        """
        consistency_issues = []
        
        # Check for conflicting information
        conflicts = await self.detect_knowledge_conflicts(knowledge_graph)
        consistency_issues.extend(conflicts)
        
        # Check for naming inconsistencies
        naming_issues = await self.detect_naming_inconsistencies(knowledge_graph)
        consistency_issues.extend(naming_issues)
        
        # Check for relationship inconsistencies
        relationship_issues = await self.detect_relationship_inconsistencies(knowledge_graph)
        consistency_issues.extend(relationship_issues)
        
        # Calculate consistency score
        total_nodes = knowledge_graph.number_of_nodes()
        consistency_score = max(0, 1 - (len(consistency_issues) / total_nodes)) if total_nodes > 0 else 1
        
        return consistency_score
```

#### Knowledge Curation Engine
```python
class KnowledgeCurationEngine:
    """
    Automated knowledge curation and maintenance
    """
    
    def __init__(self):
        self.curation_rules = {}
        self.quality_assessor = KnowledgeQualityAssessor()
        self.update_scheduler = UpdateScheduler()
        
    async def curate_knowledge_continuously(self, knowledge_graph):
        """
        Continuously curate and improve knowledge quality
        """
        curation_session = {
            'session_id': generate_uuid(),
            'curation_actions': [],
            'quality_improvements': {},
            'optimization_results': {}
        }
        
        # Identify curation opportunities
        curation_opportunities = await self.identify_curation_opportunities(knowledge_graph)
        
        # Execute curation actions
        for opportunity in curation_opportunities:
            curation_action = await self.execute_curation_action(
                opportunity,
                knowledge_graph
            )
            curation_session['curation_actions'].append(curation_action)
        
        # Optimize knowledge structure
        optimization_results = await self.optimize_knowledge_structure(knowledge_graph)
        curation_session['optimization_results'] = optimization_results
        
        # Assess quality improvements
        quality_improvements = await self.assess_quality_improvements(knowledge_graph)
        curation_session['quality_improvements'] = quality_improvements
        
        return curation_session
    
    async def identify_curation_opportunities(self, knowledge_graph):
        """
        Identify opportunities for knowledge curation
        """
        opportunities = []
        
        # Identify duplicate or near-duplicate nodes
        duplicates = await self.identify_duplicate_knowledge(knowledge_graph)
        for duplicate_set in duplicates:
            opportunities.append({
                'type': 'merge_duplicates',
                'nodes': duplicate_set,
                'priority': 'high',
                'expected_improvement': 'consistency'
            })
        
        # Identify orphaned nodes
        orphaned_nodes = await self.identify_orphaned_nodes(knowledge_graph)
        for node in orphaned_nodes:
            opportunities.append({
                'type': 'connect_orphaned',
                'node': node,
                'priority': 'medium',
                'expected_improvement': 'completeness'
            })
        
        # Identify outdated knowledge
        outdated_nodes = await self.identify_outdated_knowledge(knowledge_graph)
        for node in outdated_nodes:
            opportunities.append({
                'type': 'update_outdated',
                'node': node,
                'priority': 'high',
                'expected_improvement': 'currency'
            })
        
        # Identify missing relationships
        missing_relationships = await self.identify_missing_relationships(knowledge_graph)
        for relationship in missing_relationships:
            opportunities.append({
                'type': 'add_relationship',
                'relationship': relationship,
                'priority': 'medium',
                'expected_improvement': 'completeness'
            })
        
        return sorted(opportunities, key=lambda x: self.priority_score(x['priority']), reverse=True)
    
    async def execute_curation_action(self, opportunity, knowledge_graph):
        """
        Execute a specific curation action
        """
        action_result = {
            'opportunity': opportunity,
            'action_taken': '',
            'success': False,
            'impact': {}
        }
        
        try:
            if opportunity['type'] == 'merge_duplicates':
                result = await self.merge_duplicate_nodes(opportunity['nodes'], knowledge_graph)
                action_result['action_taken'] = 'merged_duplicate_nodes'
                action_result['impact'] = result
                
            elif opportunity['type'] == 'connect_orphaned':
                result = await self.connect_orphaned_node(opportunity['node'], knowledge_graph)
                action_result['action_taken'] = 'connected_orphaned_node'
                action_result['impact'] = result
                
            elif opportunity['type'] == 'update_outdated':
                result = await self.update_outdated_knowledge(opportunity['node'], knowledge_graph)
                action_result['action_taken'] = 'updated_outdated_knowledge'
                action_result['impact'] = result
                
            elif opportunity['type'] == 'add_relationship':
                result = await self.add_missing_relationship(opportunity['relationship'], knowledge_graph)
                action_result['action_taken'] = 'added_missing_relationship'
                action_result['impact'] = result
            
            action_result['success'] = True
            
        except Exception as e:
            action_result['error'] = str(e)
            action_result['success'] = False
        
        return action_result
```

### Knowledge Management Commands

```bash
# Knowledge graph construction
bmad knowledge build --sources "codebase,conversations,documentation"
bmad knowledge extract --from-conversations --session-id "uuid"
bmad knowledge index --codebase-path "src/" --include-dependencies

# Knowledge graph querying and exploration
bmad knowledge search --semantic "authentication patterns"
bmad knowledge explore --concept "microservices" --depth 3
bmad knowledge relationships --between "UserAuth" "DatabaseConnection"

# Knowledge quality management
bmad knowledge assess --quality-dimensions "completeness,consistency,accuracy"
bmad knowledge curate --auto-fix --quality-threshold 0.8
bmad knowledge validate --check-conflicts --suggest-merges

# Knowledge graph optimization
bmad knowledge optimize --structure --remove-duplicates
bmad knowledge update --refresh-outdated --source "recent-conversations"
bmad knowledge export --format "graphml" --include-metadata
```

This Knowledge Graph Builder creates a sophisticated, multi-dimensional knowledge representation that captures not just information, but the complex relationships and contexts that make knowledge truly useful for development teams. The system continuously learns, curates, and optimizes the knowledge graph to maintain high quality and relevance.