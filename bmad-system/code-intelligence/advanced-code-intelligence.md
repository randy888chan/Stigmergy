# Advanced Code Intelligence

## Deep Code Understanding and Analysis for Enhanced BMAD System

The Advanced Code Intelligence module provides sophisticated code understanding, analysis, and generation capabilities that work seamlessly with Claude Code tools to deliver intelligent insights, recommendations, and automated code improvements.

### Code Intelligence Architecture

#### Comprehensive Code Understanding Framework
```yaml
code_intelligence_architecture:
  understanding_layers:
    syntactic_understanding:
      - abstract_syntax_trees: "Parse and analyze code structure"
      - control_flow_graphs: "Understand execution flow patterns"
      - data_flow_analysis: "Track data movement and transformations"
      - call_graph_analysis: "Map function and method relationships"
      - dependency_graphs: "Understand code dependencies"
      
    semantic_understanding:
      - intent_recognition: "Understand what code is meant to do"
      - behavior_analysis: "Analyze actual code behavior"
      - business_logic_extraction: "Extract business rules and logic"
      - domain_concept_mapping: "Map code to domain concepts"
      - requirement_traceability: "Trace requirements to implementation"
      
    architectural_understanding:
      - design_pattern_recognition: "Identify architectural patterns"
      - component_relationship_mapping: "Understand component interactions"
      - layered_architecture_analysis: "Analyze architectural layers"
      - coupling_cohesion_analysis: "Assess code coupling and cohesion"
      - architectural_debt_detection: "Identify architectural problems"
      
    quality_understanding:
      - code_quality_metrics: "Calculate comprehensive quality metrics"
      - maintainability_assessment: "Assess code maintainability"
      - complexity_analysis: "Analyze code complexity patterns"
      - readability_evaluation: "Evaluate code readability"
      - testability_assessment: "Assess code testability"
      
  analysis_capabilities:
    static_analysis:
      - code_structure_analysis: "Analyze code organization and structure"
      - type_system_analysis: "Understand type usage and relationships"
      - security_vulnerability_detection: "Identify security vulnerabilities"
      - performance_bottleneck_identification: "Find performance issues"
      - code_smell_detection: "Identify code smells and anti-patterns"
      
    dynamic_analysis:
      - runtime_behavior_prediction: "Predict runtime behavior"
      - resource_usage_analysis: "Analyze memory and CPU usage patterns"
      - performance_profiling: "Profile performance characteristics"
      - error_prone_pattern_detection: "Identify error-prone code patterns"
      - concurrency_issue_detection: "Find concurrency and threading issues"
      
    historical_analysis:
      - evolution_pattern_analysis: "Analyze how code evolves over time"
      - change_impact_analysis: "Assess impact of code changes"
      - regression_risk_assessment: "Assess risk of introducing regressions"
      - maintenance_pattern_analysis: "Analyze maintenance patterns"
      - technical_debt_trend_analysis: "Track technical debt accumulation"
      
    contextual_analysis:
      - project_context_understanding: "Understand code within project context"
      - team_context_integration: "Consider team practices and preferences"
      - domain_context_awareness: "Understand business domain context"
      - technology_stack_optimization: "Optimize for technology stack"
      - environmental_context_consideration: "Consider deployment environment"
      
  intelligence_services:
    code_generation_intelligence:
      - context_aware_generation: "Generate code that fits existing patterns"
      - quality_focused_generation: "Generate high-quality, maintainable code"
      - pattern_based_generation: "Use proven patterns in code generation"
      - optimization_aware_generation: "Generate optimized code"
      - security_conscious_generation: "Generate secure code by default"
      
    refactoring_intelligence:
      - intelligent_refactoring_suggestions: "Suggest optimal refactoring approaches"
      - impact_aware_refactoring: "Consider refactoring impact on system"
      - pattern_based_refactoring: "Apply proven refactoring patterns"
      - automated_refactoring_execution: "Execute safe automated refactorings"
      - refactoring_verification: "Verify refactoring correctness"
      
    optimization_intelligence:
      - performance_optimization_suggestions: "Suggest performance improvements"
      - memory_optimization_recommendations: "Recommend memory optimizations"
      - algorithmic_improvement_suggestions: "Suggest algorithmic improvements"
      - architectural_optimization_advice: "Provide architectural optimization advice"
      - resource_utilization_optimization: "Optimize resource utilization"
      
    quality_intelligence:
      - automated_quality_assessment: "Automatically assess code quality"
      - quality_improvement_recommendations: "Recommend quality improvements"
      - maintainability_enhancement_suggestions: "Suggest maintainability improvements"
      - readability_improvement_advice: "Provide readability improvement advice"
      - testability_enhancement_recommendations: "Recommend testability improvements"
```

#### Advanced Code Intelligence Implementation
```python
import ast
import inspect
import networkx as nx
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union, Set
from dataclasses import dataclass, field
from enum import Enum
import re
import json
from datetime import datetime, timedelta
import asyncio
from pathlib import Path
import hashlib
from collections import defaultdict, Counter
import subprocess
import tempfile
import os

class CodeComplexity(Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    VERY_COMPLEX = "very_complex"

class QualityLevel(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

@dataclass
class CodeElement:
    """
    Represents a code element with its metadata and analysis results
    """
    id: str
    name: str
    type: str  # function, class, module, variable, etc.
    file_path: str
    start_line: int
    end_line: int
    source_code: str
    ast_node: Optional[ast.AST] = None
    dependencies: List[str] = field(default_factory=list)
    dependents: List[str] = field(default_factory=list)
    complexity_metrics: Dict[str, Any] = field(default_factory=dict)
    quality_metrics: Dict[str, Any] = field(default_factory=dict)
    analysis_results: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CodeIntelligenceResults:
    """
    Results of comprehensive code intelligence analysis
    """
    codebase_overview: Dict[str, Any]
    element_analysis: Dict[str, CodeElement]
    architectural_insights: Dict[str, Any]
    quality_assessment: Dict[str, Any]
    improvement_recommendations: List[Dict[str, Any]]
    security_findings: List[Dict[str, Any]]
    performance_insights: List[Dict[str, Any]]
    refactoring_opportunities: List[Dict[str, Any]]

class AdvancedCodeIntelligence:
    """
    Advanced code intelligence engine for deep code understanding and analysis
    """
    
    def __init__(self, claude_code_interface, config=None):
        self.claude_code = claude_code_interface
        self.config = config or {
            'max_file_size': 100000,  # 100KB
            'complexity_threshold': 10,
            'quality_threshold': 0.7,
            'security_scan_enabled': True,
            'performance_analysis_enabled': True,
            'deep_analysis_enabled': True
        }
        
        # Core analysis engines
        self.syntactic_analyzer = SyntacticAnalyzer(self.config)
        self.semantic_analyzer = SemanticAnalyzer(self.config)
        self.architectural_analyzer = ArchitecturalAnalyzer(self.config)
        self.quality_analyzer = QualityAnalyzer(self.config)
        
        # Specialized analyzers
        self.security_analyzer = SecurityAnalyzer(self.config)
        self.performance_analyzer = PerformanceAnalyzer(self.config)
        self.pattern_recognizer = CodePatternRecognizer(self.config)
        self.refactoring_advisor = RefactoringAdvisor(self.config)
        
        # Intelligence services
        self.code_generator = IntelligentCodeGenerator(self.claude_code, self.config)
        self.optimization_advisor = OptimizationAdvisor(self.config)
        self.quality_enhancer = QualityEnhancer(self.config)
        
        # Knowledge base
        self.pattern_library = CodePatternLibrary()
        self.best_practices = BestPracticesDatabase()
        
        # Analysis cache
        self.analysis_cache = {}
        self.dependency_graph = nx.DiGraph()
        
    async def analyze_codebase(self, codebase_path, analysis_scope=None):
        """
        Perform comprehensive analysis of entire codebase
        """
        analysis_session = {
            'session_id': generate_uuid(),
            'start_time': datetime.utcnow(),
            'codebase_path': codebase_path,
            'analysis_scope': analysis_scope or 'full',
            'discovered_files': [],
            'analysis_results': {},
            'insights': {},
            'recommendations': []
        }
        
        # Discover and categorize code files
        discovered_files = await self.discover_code_files(codebase_path, analysis_scope)
        analysis_session['discovered_files'] = discovered_files
        
        # Create codebase overview
        codebase_overview = await self.create_codebase_overview(discovered_files)
        analysis_session['codebase_overview'] = codebase_overview
        
        # Analyze individual code elements
        element_analysis = await self.analyze_code_elements(discovered_files)
        analysis_session['element_analysis'] = element_analysis
        
        # Build dependency graph
        dependency_graph = await self.build_dependency_graph(element_analysis)
        analysis_session['dependency_graph'] = dependency_graph
        
        # Perform architectural analysis
        architectural_insights = await self.architectural_analyzer.analyze_architecture(
            element_analysis,
            dependency_graph,
            codebase_overview
        )
        analysis_session['architectural_insights'] = architectural_insights
        
        # Perform quality assessment
        quality_assessment = await self.quality_analyzer.assess_overall_quality(
            element_analysis,
            architectural_insights,
            codebase_overview
        )
        analysis_session['quality_assessment'] = quality_assessment
        
        # Generate improvement recommendations
        improvement_recommendations = await self.generate_improvement_recommendations(
            analysis_session
        )
        analysis_session['improvement_recommendations'] = improvement_recommendations
        
        # Perform security analysis
        if self.config['security_scan_enabled']:
            security_findings = await self.security_analyzer.scan_for_vulnerabilities(
                element_analysis
            )
            analysis_session['security_findings'] = security_findings
        
        # Perform performance analysis
        if self.config['performance_analysis_enabled']:
            performance_insights = await self.performance_analyzer.analyze_performance(
                element_analysis,
                architectural_insights
            )
            analysis_session['performance_insights'] = performance_insights
        
        # Identify refactoring opportunities
        refactoring_opportunities = await self.refactoring_advisor.identify_opportunities(
            element_analysis,
            quality_assessment,
            architectural_insights
        )
        analysis_session['refactoring_opportunities'] = refactoring_opportunities
        
        # Create comprehensive results
        analysis_results = CodeIntelligenceResults(
            codebase_overview=codebase_overview,
            element_analysis=element_analysis,
            architectural_insights=architectural_insights,
            quality_assessment=quality_assessment,
            improvement_recommendations=improvement_recommendations,
            security_findings=analysis_session.get('security_findings', []),
            performance_insights=analysis_session.get('performance_insights', []),
            refactoring_opportunities=refactoring_opportunities
        )
        
        analysis_session['final_results'] = analysis_results
        analysis_session['end_time'] = datetime.utcnow()
        analysis_session['analysis_duration'] = (
            analysis_session['end_time'] - analysis_session['start_time']
        ).total_seconds()
        
        return analysis_session
    
    async def discover_code_files(self, codebase_path, analysis_scope):
        """
        Discover and categorize code files in the codebase
        """
        discovered_files = {
            'python_files': [],
            'javascript_files': [],
            'typescript_files': [],
            'java_files': [],
            'cpp_files': [],
            'other_files': [],
            'total_files': 0,
            'total_lines': 0
        }
        
        # Use Claude Code to list files
        path_obj = Path(codebase_path)
        
        # Define file extensions to analyze
        code_extensions = {
            '.py': 'python_files',
            '.js': 'javascript_files',
            '.ts': 'typescript_files',
            '.tsx': 'typescript_files',
            '.jsx': 'javascript_files',
            '.java': 'java_files',
            '.cpp': 'cpp_files',
            '.c': 'cpp_files',
            '.h': 'cpp_files',
            '.hpp': 'cpp_files'
        }
        
        # Recursively find code files
        for file_path in path_obj.rglob('*'):
            if file_path.is_file():
                suffix = file_path.suffix.lower()
                if suffix in code_extensions:
                    category = code_extensions[suffix]
                    
                    # Read file metadata
                    try:
                        file_content = await self.claude_code.read(str(file_path))
                        line_count = len(file_content.split('\n'))
                        
                        file_info = {
                            'path': str(file_path),
                            'relative_path': str(file_path.relative_to(path_obj)),
                            'size': file_path.stat().st_size,
                            'lines': line_count,
                            'modified': datetime.fromtimestamp(file_path.stat().st_mtime),
                            'language': category.replace('_files', '')
                        }
                        
                        discovered_files[category].append(file_info)
                        discovered_files['total_files'] += 1
                        discovered_files['total_lines'] += line_count
                        
                    except Exception as e:
                        # Skip files that can't be read
                        continue
        
        return discovered_files
    
    async def analyze_code_elements(self, discovered_files):
        """
        Analyze individual code elements (functions, classes, modules)
        """
        element_analysis = {}
        
        # Analyze Python files
        for file_info in discovered_files.get('python_files', []):
            try:
                file_elements = await self.analyze_python_file(file_info)
                element_analysis.update(file_elements)
            except Exception as e:
                # Log error but continue with other files
                continue
        
        # Analyze JavaScript/TypeScript files
        for file_info in discovered_files.get('javascript_files', []) + discovered_files.get('typescript_files', []):
            try:
                file_elements = await self.analyze_javascript_file(file_info)
                element_analysis.update(file_elements)
            except Exception as e:
                continue
        
        # Add more language analyzers as needed
        
        return element_analysis
    
    async def analyze_python_file(self, file_info):
        """
        Analyze Python file and extract code elements
        """
        file_elements = {}
        
        # Read file content
        file_content = await self.claude_code.read(file_info['path'])
        
        try:
            # Parse AST
            tree = ast.parse(file_content)
            
            # Extract functions
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    element_id = f"{file_info['path']}::{node.name}"
                    
                    function_element = CodeElement(
                        id=element_id,
                        name=node.name,
                        type='function',
                        file_path=file_info['path'],
                        start_line=node.lineno,
                        end_line=getattr(node, 'end_lineno', node.lineno),
                        source_code=ast.get_source_segment(file_content, node) or '',
                        ast_node=node
                    )
                    
                    # Analyze function complexity
                    complexity_metrics = await self.calculate_complexity_metrics(node, file_content)
                    function_element.complexity_metrics = complexity_metrics
                    
                    # Analyze function quality
                    quality_metrics = await self.calculate_quality_metrics(function_element)
                    function_element.quality_metrics = quality_metrics
                    
                    # Extract dependencies
                    dependencies = await self.extract_function_dependencies(node, tree)
                    function_element.dependencies = dependencies
                    
                    file_elements[element_id] = function_element
                
                elif isinstance(node, ast.ClassDef):
                    element_id = f"{file_info['path']}::{node.name}"
                    
                    class_element = CodeElement(
                        id=element_id,
                        name=node.name,
                        type='class',
                        file_path=file_info['path'],
                        start_line=node.lineno,
                        end_line=getattr(node, 'end_lineno', node.lineno),
                        source_code=ast.get_source_segment(file_content, node) or '',
                        ast_node=node
                    )
                    
                    # Analyze class complexity
                    complexity_metrics = await self.calculate_class_complexity_metrics(node, file_content)
                    class_element.complexity_metrics = complexity_metrics
                    
                    # Analyze class quality
                    quality_metrics = await self.calculate_quality_metrics(class_element)
                    class_element.quality_metrics = quality_metrics
                    
                    # Extract class dependencies
                    dependencies = await self.extract_class_dependencies(node, tree)
                    class_element.dependencies = dependencies
                    
                    file_elements[element_id] = class_element
        
        except SyntaxError as e:
            # Handle syntax errors gracefully
            pass
        
        return file_elements
    
    async def calculate_complexity_metrics(self, node, file_content):
        """
        Calculate various complexity metrics for code elements
        """
        complexity_metrics = {}
        
        # Cyclomatic complexity
        complexity_metrics['cyclomatic_complexity'] = self.calculate_cyclomatic_complexity(node)
        
        # Cognitive complexity
        complexity_metrics['cognitive_complexity'] = self.calculate_cognitive_complexity(node)
        
        # Lines of code
        complexity_metrics['lines_of_code'] = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
        
        # Number of parameters (for functions)
        if isinstance(node, ast.FunctionDef):
            complexity_metrics['parameter_count'] = len(node.args.args)
        
        # Nesting depth
        complexity_metrics['max_nesting_depth'] = self.calculate_max_nesting_depth(node)
        
        # Determine overall complexity level
        cyclomatic = complexity_metrics['cyclomatic_complexity']
        if cyclomatic <= 5:
            complexity_metrics['complexity_level'] = CodeComplexity.SIMPLE
        elif cyclomatic <= 10:
            complexity_metrics['complexity_level'] = CodeComplexity.MODERATE
        elif cyclomatic <= 20:
            complexity_metrics['complexity_level'] = CodeComplexity.COMPLEX
        else:
            complexity_metrics['complexity_level'] = CodeComplexity.VERY_COMPLEX
        
        return complexity_metrics
    
    def calculate_cyclomatic_complexity(self, node):
        """
        Calculate cyclomatic complexity of a code element
        """
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            # Decision points that increase complexity
            if isinstance(child, (ast.If, ast.While, ast.For, ast.Try)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                # Each boolean operator adds complexity
                complexity += len(child.values) - 1
            elif isinstance(child, ast.Compare):
                # Each comparison operator adds complexity
                complexity += len(child.ops)
        
        return complexity
    
    def calculate_cognitive_complexity(self, node):
        """
        Calculate cognitive complexity (readability-focused metric)
        """
        cognitive_complexity = 0
        nesting_level = 0
        
        def visit_node(n, current_nesting):
            nonlocal cognitive_complexity
            
            if isinstance(n, (ast.If, ast.While, ast.For)):
                cognitive_complexity += 1 + current_nesting
                current_nesting += 1
            elif isinstance(n, ast.Try):
                cognitive_complexity += 1 + current_nesting
                current_nesting += 1
            elif isinstance(n, ast.BoolOp):
                cognitive_complexity += len(n.values) - 1
            
            for child in ast.iter_child_nodes(n):
                visit_node(child, current_nesting)
        
        visit_node(node, nesting_level)
        return cognitive_complexity
    
    def calculate_max_nesting_depth(self, node):
        """
        Calculate maximum nesting depth in code element
        """
        max_depth = 0
        
        def calculate_depth(n, current_depth):
            nonlocal max_depth
            max_depth = max(max_depth, current_depth)
            
            if isinstance(n, (ast.If, ast.While, ast.For, ast.Try, ast.With)):
                current_depth += 1
            
            for child in ast.iter_child_nodes(n):
                calculate_depth(child, current_depth)
        
        calculate_depth(node, 0)
        return max_depth
    
    async def calculate_quality_metrics(self, code_element):
        """
        Calculate quality metrics for code elements
        """
        quality_metrics = {}
        
        # Code length assessment
        loc = code_element.complexity_metrics.get('lines_of_code', 0)
        if loc <= 20:
            quality_metrics['length_quality'] = QualityLevel.EXCELLENT
        elif loc <= 50:
            quality_metrics['length_quality'] = QualityLevel.GOOD
        elif loc <= 100:
            quality_metrics['length_quality'] = QualityLevel.FAIR
        else:
            quality_metrics['length_quality'] = QualityLevel.POOR
        
        # Complexity assessment
        complexity_level = code_element.complexity_metrics.get('complexity_level')
        if complexity_level == CodeComplexity.SIMPLE:
            quality_metrics['complexity_quality'] = QualityLevel.EXCELLENT
        elif complexity_level == CodeComplexity.MODERATE:
            quality_metrics['complexity_quality'] = QualityLevel.GOOD
        elif complexity_level == CodeComplexity.COMPLEX:
            quality_metrics['complexity_quality'] = QualityLevel.FAIR
        else:
            quality_metrics['complexity_quality'] = QualityLevel.POOR
        
        # Naming convention assessment
        naming_quality = await self.assess_naming_quality(code_element)
        quality_metrics['naming_quality'] = naming_quality
        
        # Documentation assessment
        documentation_quality = await self.assess_documentation_quality(code_element)
        quality_metrics['documentation_quality'] = documentation_quality
        
        # Calculate overall quality score
        quality_scores = {
            QualityLevel.EXCELLENT: 1.0,
            QualityLevel.GOOD: 0.8,
            QualityLevel.FAIR: 0.6,
            QualityLevel.POOR: 0.3
        }
        
        scores = [
            quality_scores[quality_metrics['length_quality']],
            quality_scores[quality_metrics['complexity_quality']],
            quality_scores[quality_metrics['naming_quality']],
            quality_scores[quality_metrics['documentation_quality']]
        ]
        
        overall_score = np.mean(scores)
        quality_metrics['overall_quality_score'] = overall_score
        
        if overall_score >= 0.9:
            quality_metrics['overall_quality_level'] = QualityLevel.EXCELLENT
        elif overall_score >= 0.7:
            quality_metrics['overall_quality_level'] = QualityLevel.GOOD
        elif overall_score >= 0.5:
            quality_metrics['overall_quality_level'] = QualityLevel.FAIR
        else:
            quality_metrics['overall_quality_level'] = QualityLevel.POOR
        
        return quality_metrics
    
    async def assess_naming_quality(self, code_element):
        """
        Assess quality of naming conventions
        """
        name = code_element.name
        
        # Check naming conventions
        quality_factors = []
        
        # Length check
        if 3 <= len(name) <= 30:
            quality_factors.append(1.0)
        elif len(name) < 3:
            quality_factors.append(0.3)  # Too short
        else:
            quality_factors.append(0.7)  # Too long but acceptable
        
        # Convention check
        if code_element.type == 'function':
            # Functions should be snake_case or camelCase
            if re.match(r'^[a-z][a-z0-9_]*$', name) or re.match(r'^[a-z][a-zA-Z0-9]*$', name):
                quality_factors.append(1.0)
            else:
                quality_factors.append(0.5)
        elif code_element.type == 'class':
            # Classes should be PascalCase
            if re.match(r'^[A-Z][a-zA-Z0-9]*$', name):
                quality_factors.append(1.0)
            else:
                quality_factors.append(0.5)
        
        # Descriptiveness check (simple heuristic)
        if len(name) >= 5 and not re.match(r'^[a-z]+\d+$', name):
            quality_factors.append(1.0)
        else:
            quality_factors.append(0.7)
        
        overall_score = np.mean(quality_factors)
        
        if overall_score >= 0.9:
            return QualityLevel.EXCELLENT
        elif overall_score >= 0.7:
            return QualityLevel.GOOD
        elif overall_score >= 0.5:
            return QualityLevel.FAIR
        else:
            return QualityLevel.POOR
    
    async def assess_documentation_quality(self, code_element):
        """
        Assess quality of code documentation
        """
        if not code_element.ast_node:
            return QualityLevel.POOR
        
        # Check for docstring
        if isinstance(code_element.ast_node, (ast.FunctionDef, ast.ClassDef)):
            if (code_element.ast_node.body and 
                isinstance(code_element.ast_node.body[0], ast.Expr) and
                isinstance(code_element.ast_node.body[0].value, ast.Constant) and
                isinstance(code_element.ast_node.body[0].value.value, str)):
                
                docstring = code_element.ast_node.body[0].value.value
                
                # Assess docstring quality
                if len(docstring.strip()) > 50:
                    return QualityLevel.EXCELLENT
                elif len(docstring.strip()) > 20:
                    return QualityLevel.GOOD
                elif len(docstring.strip()) > 0:
                    return QualityLevel.FAIR
                else:
                    return QualityLevel.POOR
            else:
                return QualityLevel.POOR
        
        return QualityLevel.FAIR  # Default for other element types
    
    async def generate_improvement_recommendations(self, analysis_session):
        """
        Generate actionable improvement recommendations
        """
        recommendations = []
        
        element_analysis = analysis_session['element_analysis']
        quality_assessment = analysis_session['quality_assessment']
        
        # Analyze each code element for improvement opportunities
        for element_id, element in element_analysis.items():
            element_recommendations = await self.generate_element_recommendations(element)
            recommendations.extend(element_recommendations)
        
        # Generate architectural recommendations
        architectural_recommendations = await self.generate_architectural_recommendations(
            analysis_session['architectural_insights']
        )
        recommendations.extend(architectural_recommendations)
        
        # Generate overall quality recommendations
        quality_recommendations = await self.generate_quality_recommendations(
            quality_assessment
        )
        recommendations.extend(quality_recommendations)
        
        # Sort recommendations by priority and impact
        recommendations.sort(key=lambda x: (x.get('priority', 'medium'), x.get('impact', 'medium')), reverse=True)
        
        return recommendations
    
    async def generate_element_recommendations(self, element):
        """
        Generate recommendations for individual code elements
        """
        recommendations = []
        
        # Complexity recommendations
        complexity_level = element.complexity_metrics.get('complexity_level')
        if complexity_level in [CodeComplexity.COMPLEX, CodeComplexity.VERY_COMPLEX]:
            recommendations.append({
                'type': 'complexity_reduction',
                'element_id': element.id,
                'element_name': element.name,
                'priority': 'high',
                'impact': 'high',
                'description': f"Reduce complexity of {element.type} '{element.name}' (current: {element.complexity_metrics.get('cyclomatic_complexity')})",
                'suggestions': [
                    'Break down into smaller functions',
                    'Extract common logic into helper functions',
                    'Simplify conditional logic',
                    'Consider using design patterns'
                ],
                'file_path': element.file_path,
                'line_range': f"{element.start_line}-{element.end_line}"
            })
        
        # Quality recommendations
        overall_quality = element.quality_metrics.get('overall_quality_level')
        if overall_quality in [QualityLevel.FAIR, QualityLevel.POOR]:
            recommendations.append({
                'type': 'quality_improvement',
                'element_id': element.id,
                'element_name': element.name,
                'priority': 'medium',
                'impact': 'medium',
                'description': f"Improve quality of {element.type} '{element.name}'",
                'suggestions': await self.generate_quality_improvement_suggestions(element),
                'file_path': element.file_path,
                'line_range': f"{element.start_line}-{element.end_line}"
            })
        
        # Documentation recommendations
        doc_quality = element.quality_metrics.get('documentation_quality')
        if doc_quality in [QualityLevel.FAIR, QualityLevel.POOR]:
            recommendations.append({
                'type': 'documentation_improvement',
                'element_id': element.id,
                'element_name': element.name,
                'priority': 'low',
                'impact': 'medium',
                'description': f"Add or improve documentation for {element.type} '{element.name}'",
                'suggestions': [
                    'Add comprehensive docstring',
                    'Document parameters and return values',
                    'Include usage examples',
                    'Add type hints'
                ],
                'file_path': element.file_path,
                'line_range': f"{element.start_line}-{element.end_line}"
            })
        
        return recommendations
    
    async def generate_quality_improvement_suggestions(self, element):
        """
        Generate specific quality improvement suggestions for an element
        """
        suggestions = []
        
        # Naming suggestions
        if element.quality_metrics.get('naming_quality') in [QualityLevel.FAIR, QualityLevel.POOR]:
            suggestions.append('Improve naming to be more descriptive')
            suggestions.append('Follow naming conventions for ' + element.type)
        
        # Length suggestions
        if element.quality_metrics.get('length_quality') in [QualityLevel.FAIR, QualityLevel.POOR]:
            suggestions.append('Break down into smaller, more focused components')
            suggestions.append('Extract reusable logic into separate functions')
        
        # Complexity suggestions
        if element.quality_metrics.get('complexity_quality') in [QualityLevel.FAIR, QualityLevel.POOR]:
            suggestions.append('Simplify logic and reduce cyclomatic complexity')
            suggestions.append('Consider using guard clauses to reduce nesting')
        
        return suggestions
    
    async def intelligent_code_generation(self, generation_request):
        """
        Generate code using advanced intelligence and context awareness
        """
        return await self.code_generator.generate_intelligent_code(generation_request)
    
    async def suggest_refactoring(self, target_element):
        """
        Suggest intelligent refactoring for code element
        """
        return await self.refactoring_advisor.suggest_refactoring(target_element)
    
    async def optimize_performance(self, target_code):
        """
        Suggest performance optimizations for code
        """
        return await self.optimization_advisor.suggest_optimizations(target_code)

class SyntacticAnalyzer:
    """
    Analyzes code structure and syntax patterns
    """
    
    def __init__(self, config):
        self.config = config
    
    async def analyze_structure(self, code_elements):
        """
        Analyze syntactic structure of code elements
        """
        structural_analysis = {
            'complexity_distribution': {},
            'pattern_usage': {},
            'structural_metrics': {},
            'organization_assessment': {}
        }
        
        # Analyze complexity distribution
        complexity_counts = defaultdict(int)
        for element in code_elements.values():
            complexity_level = element.complexity_metrics.get('complexity_level')
            complexity_counts[complexity_level.value] += 1
        
        structural_analysis['complexity_distribution'] = dict(complexity_counts)
        
        # Analyze structural patterns
        pattern_analysis = await self.analyze_structural_patterns(code_elements)
        structural_analysis['pattern_usage'] = pattern_analysis
        
        return structural_analysis
    
    async def analyze_structural_patterns(self, code_elements):
        """
        Identify structural patterns in code
        """
        patterns = {
            'inheritance_hierarchies': [],
            'composition_patterns': [],
            'function_call_patterns': [],
            'module_organization_patterns': []
        }
        
        # Analyze inheritance patterns
        class_elements = {k: v for k, v in code_elements.items() if v.type == 'class'}
        for element in class_elements.values():
            if element.ast_node and element.ast_node.bases:
                patterns['inheritance_hierarchies'].append({
                    'class': element.name,
                    'bases': [base.id if isinstance(base, ast.Name) else str(base) for base in element.ast_node.bases],
                    'file': element.file_path
                })
        
        return patterns

class IntelligentCodeGenerator:
    """
    Generates intelligent, context-aware code
    """
    
    def __init__(self, claude_code, config):
        self.claude_code = claude_code
        self.config = config
    
    async def generate_intelligent_code(self, generation_request):
        """
        Generate code using intelligence and best practices
        """
        intelligent_generation = {
            'generated_code': '',
            'quality_score': 0.0,
            'applied_patterns': [],
            'optimization_notes': [],
            'security_considerations': []
        }
        
        # Analyze generation context
        context_analysis = await self.analyze_generation_context(generation_request)
        
        # Select appropriate patterns and templates
        selected_patterns = await self.select_generation_patterns(generation_request, context_analysis)
        
        # Generate code using Claude Code with enhanced prompts
        enhanced_prompt = await self.create_enhanced_generation_prompt(
            generation_request,
            context_analysis,
            selected_patterns
        )
        
        # Use Claude Code to generate the actual code
        generated_code = await self.claude_code.generate_code({
            'prompt': enhanced_prompt,
            'context': generation_request.get('context', {}),
            'requirements': generation_request.get('requirements', []),
            'quality_requirements': self.config.get('quality_requirements', {})
        })
        
        intelligent_generation['generated_code'] = generated_code
        
        # Assess generated code quality
        quality_assessment = await self.assess_generated_code_quality(generated_code)
        intelligent_generation.update(quality_assessment)
        
        return intelligent_generation
    
    async def create_enhanced_generation_prompt(self, generation_request, context_analysis, selected_patterns):
        """
        Create enhanced prompt for intelligent code generation
        """
        prompt = f"""
Generate high-quality {generation_request.get('language', 'Python')} code for: {generation_request.get('description', '')}

Requirements:
{chr(10).join(f"- {req}" for req in generation_request.get('requirements', []))}

Context Analysis:
- Project Type: {context_analysis.get('project_type', 'Unknown')}
- Complexity Level: {context_analysis.get('complexity_level', 'moderate')}
- Performance Requirements: {context_analysis.get('performance_requirements', 'standard')}
- Security Level: {context_analysis.get('security_level', 'standard')}

Apply These Patterns:
{chr(10).join(f"- {pattern['name']}: {pattern['description']}" for pattern in selected_patterns)}

Quality Standards:
- Follow best practices and coding standards
- Ensure code is maintainable, readable, and well-documented
- Include comprehensive error handling
- Add appropriate type hints (for Python)
- Optimize for both performance and clarity
- Consider security implications
- Write testable code with clear interfaces

Generate complete, production-ready code with:
1. Clear, descriptive names
2. Appropriate documentation
3. Error handling
4. Type safety
5. Performance considerations
6. Security best practices
"""
        return prompt
```

### Code Intelligence Commands

```bash
# Comprehensive code analysis
bmad code analyze --path "src/" --deep-analysis --security-scan
bmad code overview --codebase "." --metrics --quality-assessment
bmad code elements --extract-all --complexity-metrics

# Quality assessment and improvement
bmad code quality --assess --recommendations --improvement-plan
bmad code complexity --analyze --threshold 10 --report-detailed
bmad code refactor --suggest --target "high-complexity" --safe-only

# Intelligent code generation
bmad code generate --intelligent --context-aware --requirements "spec.md"
bmad code improve --element "function_name" --quality-focused
bmad code optimize --performance --target "bottlenecks"

# Security and performance analysis
bmad code security --scan-vulnerabilities --recommendations
bmad code performance --analyze-bottlenecks --optimization-suggestions
bmad code patterns --recognize --suggest-improvements

# Architecture and dependency analysis
bmad code architecture --analyze --patterns --recommendations
bmad code dependencies --map --analyze-coupling --suggest-improvements
bmad code technical-debt --assess --prioritize --action-plan
```

This Advanced Code Intelligence module provides sophisticated code understanding, analysis, and generation capabilities that seamlessly integrate with Claude Code to deliver intelligent insights, automated improvements, and context-aware code generation for enhanced development productivity.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Phase 1: Core Intelligence Foundation - COMPLETED \u2705", "status": "completed", "priority": "high", "id": "phase1"}, {"content": "Phase 2: LLM Integration and Knowledge Management - COMPLETED \u2705", "status": "completed", "priority": "high", "id": "phase2"}, {"content": "Phase 3: Advanced Intelligence and Claude Code Integration - IN PROGRESS", "status": "in_progress", "priority": "high", "id": "phase3"}, {"content": "Create Autonomous Development Engine", "status": "completed", "priority": "high", "id": "3.1"}, {"content": "Implement Advanced Code Intelligence", "status": "completed", "priority": "high", "id": "3.2"}, {"content": "Build Self-Improving AI Capabilities", "status": "in_progress", "priority": "high", "id": "3.3"}, {"content": "Develop Intelligent Automation Framework", "status": "pending", "priority": "high", "id": "3.4"}, {"content": "Create Quality Assurance Automation", "status": "pending", "priority": "high", "id": "3.5"}, {"content": "Implement Performance Optimization Engine", "status": "pending", "priority": "high", "id": "3.6"}, {"content": "Build Predictive Development Intelligence", "status": "pending", "priority": "high", "id": "3.7"}, {"content": "Phase 4: Self-Optimization and Enterprise Features", "status": "pending", "priority": "medium", "id": "phase4"}]