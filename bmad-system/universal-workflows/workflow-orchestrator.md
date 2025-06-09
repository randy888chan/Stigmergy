# Universal Workflow Orchestrator

## LLM-Agnostic Workflow Engine for Enhanced BMAD System

The Universal Workflow Orchestrator provides sophisticated workflow execution capabilities that work seamlessly with any LLM backend, enabling dynamic task routing, multi-LLM collaboration, and cost-optimized execution patterns.

### Universal Workflow Architecture

#### LLM-Agnostic Workflow Framework
```yaml
universal_workflow_architecture:
  workflow_types:
    sequential_workflows:
      - linear_execution: "Step-by-step sequential task execution"
      - dependency_based: "Execute based on task dependencies"
      - conditional_branching: "Branch based on execution results"
      - iterative_refinement: "Repeat until quality threshold met"
      
    parallel_workflows:
      - concurrent_execution: "Execute multiple tasks simultaneously"
      - fan_out_fan_in: "Distribute work and aggregate results"
      - map_reduce_patterns: "Parallel processing with result aggregation"
      - distributed_consensus: "Multi-LLM consensus building"
      
    adaptive_workflows:
      - dynamic_routing: "Route tasks to optimal LLMs during execution"
      - self_healing: "Automatic error recovery and retry"
      - performance_optimization: "Optimize execution based on performance"
      - cost_optimization: "Minimize costs while maintaining quality"
      
    collaborative_workflows:
      - multi_llm_collaboration: "Multiple LLMs working together"
      - expert_consultation: "Route to specialized LLMs for expertise"
      - consensus_building: "Build consensus across multiple LLM outputs"
      - peer_review: "LLMs reviewing each other's work"
      
  execution_strategies:
    capability_aware_routing:
      - strength_based_assignment: "Assign tasks to LLM strengths"
      - weakness_mitigation: "Compensate for LLM weaknesses"
      - capability_combination: "Combine complementary capabilities"
      - expertise_matching: "Match task requirements to LLM expertise"
      
    cost_optimization:
      - cost_benefit_analysis: "Optimize cost vs quality trade-offs"
      - budget_aware_execution: "Execute within budget constraints"
      - dynamic_pricing_adaptation: "Adapt to changing LLM costs"
      - efficiency_maximization: "Maximize output per dollar spent"
      
    quality_assurance:
      - multi_llm_validation: "Validate outputs using multiple LLMs"
      - quality_scoring: "Score outputs for quality metrics"
      - error_detection: "Detect and correct errors automatically"
      - continuous_improvement: "Learn and improve over time"
      
    performance_optimization:
      - latency_minimization: "Minimize execution time"
      - throughput_maximization: "Maximize tasks per unit time"
      - resource_utilization: "Optimize compute resource usage"
      - bottleneck_elimination: "Identify and eliminate bottlenecks"
      
  workflow_patterns:
    development_workflows:
      - code_generation: "Generate code using optimal LLMs"
      - code_review: "Multi-LLM code review process"
      - documentation_creation: "Generate comprehensive documentation"
      - testing_strategy: "Create and execute testing strategies"
      
    analysis_workflows:
      - requirement_analysis: "Analyze and refine requirements"
      - architecture_design: "Design system architecture"
      - pattern_identification: "Identify and analyze patterns"
      - decision_support: "Support complex decision making"
      
    knowledge_workflows:
      - knowledge_extraction: "Extract knowledge from various sources"
      - knowledge_synthesis: "Synthesize knowledge from multiple inputs"
      - knowledge_validation: "Validate knowledge accuracy"
      - knowledge_application: "Apply knowledge to solve problems"
```

#### Workflow Orchestrator Implementation
```python
import asyncio
import networkx as nx
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import json
from datetime import datetime, timedelta
import heapq
from concurrent.futures import ThreadPoolExecutor, as_completed

class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class WorkflowTask:
    """
    Represents a single task within a workflow
    """
    id: str
    name: str
    task_type: str
    inputs: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    llm_requirements: Dict[str, Any] = field(default_factory=dict)
    priority: TaskPriority = TaskPriority.MEDIUM
    timeout: Optional[int] = None
    retry_config: Dict[str, Any] = field(default_factory=dict)
    status: WorkflowStatus = WorkflowStatus.PENDING
    execution_metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class WorkflowDefinition:
    """
    Defines a complete workflow with tasks and execution strategy
    """
    id: str
    name: str
    description: str
    tasks: List[WorkflowTask] = field(default_factory=list)
    execution_strategy: str = "sequential"
    optimization_objectives: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

class UniversalWorkflowOrchestrator:
    """
    Orchestrates workflow execution across multiple LLM providers
    """
    
    def __init__(self, llm_interface, config=None):
        self.llm_interface = llm_interface
        self.config = config or {
            'max_concurrent_tasks': 10,
            'default_timeout': 300,
            'retry_attempts': 3,
            'cost_optimization': True,
            'quality_threshold': 0.8
        }
        
        # Workflow management components
        self.task_scheduler = TaskScheduler(self.config)
        self.execution_monitor = ExecutionMonitor()
        self.cost_optimizer = CostOptimizer(self.llm_interface)
        self.quality_assessor = QualityAssessor()
        self.error_handler = ErrorHandler(self.config)
        
        # Active workflows
        self.active_workflows = {}
        self.workflow_history = []
        
        # Performance metrics
        self.performance_metrics = PerformanceMetrics()
        
    async def execute_workflow(self, workflow_definition, execution_context=None):
        """
        Execute a workflow using optimal LLM routing and execution strategies
        """
        execution_session = {
            'workflow_id': workflow_definition.id,
            'session_id': generate_uuid(),
            'start_time': datetime.utcnow(),
            'execution_context': execution_context or {},
            'task_results': {},
            'execution_metadata': {},
            'performance_metrics': {},
            'cost_tracking': {}
        }
        
        # Register active workflow
        self.active_workflows[execution_session['session_id']] = execution_session
        
        try:
            # Analyze workflow for optimization opportunities
            workflow_analysis = await self.analyze_workflow_for_optimization(
                workflow_definition,
                execution_context
            )
            execution_session['workflow_analysis'] = workflow_analysis
            
            # Create execution plan
            execution_plan = await self.create_execution_plan(
                workflow_definition,
                workflow_analysis,
                execution_context
            )
            execution_session['execution_plan'] = execution_plan
            
            # Execute workflow based on strategy
            if workflow_definition.execution_strategy == 'sequential':
                execution_result = await self.execute_sequential_workflow(
                    workflow_definition,
                    execution_plan,
                    execution_session
                )
            elif workflow_definition.execution_strategy == 'parallel':
                execution_result = await self.execute_parallel_workflow(
                    workflow_definition,
                    execution_plan,
                    execution_session
                )
            elif workflow_definition.execution_strategy == 'adaptive':
                execution_result = await self.execute_adaptive_workflow(
                    workflow_definition,
                    execution_plan,
                    execution_session
                )
            elif workflow_definition.execution_strategy == 'collaborative':
                execution_result = await self.execute_collaborative_workflow(
                    workflow_definition,
                    execution_plan,
                    execution_session
                )
            else:
                raise ValueError(f"Unknown execution strategy: {workflow_definition.execution_strategy}")
            
            execution_session.update(execution_result)
            execution_session['status'] = WorkflowStatus.COMPLETED
            
        except Exception as e:
            execution_session['status'] = WorkflowStatus.FAILED
            execution_session['error'] = str(e)
            execution_session['error_details'] = await self.error_handler.analyze_error(e)
            
        finally:
            execution_session['end_time'] = datetime.utcnow()
            execution_session['total_duration'] = (
                execution_session['end_time'] - execution_session['start_time']
            ).total_seconds()
            
            # Clean up active workflow
            if execution_session['session_id'] in self.active_workflows:
                del self.active_workflows[execution_session['session_id']]
            
            # Store in history
            self.workflow_history.append(execution_session)
            
            # Update performance metrics
            await self.performance_metrics.update_from_execution(execution_session)
        
        return execution_session
    
    async def analyze_workflow_for_optimization(self, workflow_definition, execution_context):
        """
        Analyze workflow to identify optimization opportunities
        """
        analysis_result = {
            'optimization_opportunities': [],
            'cost_estimates': {},
            'performance_predictions': {},
            'quality_assessments': {},
            'risk_analysis': {}
        }
        
        # Analyze task complexity and LLM requirements
        for task in workflow_definition.tasks:
            task_analysis = await self.analyze_task_requirements(task, execution_context)
            
            # Identify optimal LLM for each task
            optimal_llm = await self.identify_optimal_llm_for_task(task, task_analysis)
            
            # Estimate costs
            cost_estimate = await self.cost_optimizer.estimate_task_cost(task, optimal_llm)
            analysis_result['cost_estimates'][task.id] = cost_estimate
            
            # Predict performance
            performance_prediction = await self.predict_task_performance(task, optimal_llm)
            analysis_result['performance_predictions'][task.id] = performance_prediction
            
            # Assess quality expectations
            quality_assessment = await self.quality_assessor.assess_expected_quality(
                task,
                optimal_llm
            )
            analysis_result['quality_assessments'][task.id] = quality_assessment
        
        # Identify parallelization opportunities
        parallelization_opportunities = await self.identify_parallelization_opportunities(
            workflow_definition
        )
        analysis_result['optimization_opportunities'].extend(parallelization_opportunities)
        
        # Identify cost optimization opportunities
        cost_optimizations = await self.cost_optimizer.identify_cost_optimizations(
            workflow_definition,
            analysis_result['cost_estimates']
        )
        analysis_result['optimization_opportunities'].extend(cost_optimizations)
        
        # Analyze risks
        risk_analysis = await self.analyze_workflow_risks(
            workflow_definition,
            analysis_result
        )
        analysis_result['risk_analysis'] = risk_analysis
        
        return analysis_result
    
    async def create_execution_plan(self, workflow_definition, workflow_analysis, execution_context):
        """
        Create optimized execution plan based on workflow analysis
        """
        execution_plan = {
            'execution_order': [],
            'llm_assignments': {},
            'parallelization_groups': [],
            'fallback_strategies': {},
            'optimization_strategies': [],
            'monitoring_checkpoints': []
        }
        
        # Create task dependency graph
        dependency_graph = await self.create_dependency_graph(workflow_definition.tasks)
        
        # Determine execution order
        if workflow_definition.execution_strategy == 'sequential':
            execution_order = await self.create_sequential_execution_order(
                dependency_graph,
                workflow_analysis
            )
        elif workflow_definition.execution_strategy in ['parallel', 'adaptive', 'collaborative']:
            execution_order = await self.create_parallel_execution_order(
                dependency_graph,
                workflow_analysis
            )
        
        execution_plan['execution_order'] = execution_order
        
        # Assign optimal LLMs to tasks
        for task in workflow_definition.tasks:
            optimal_llm = await self.identify_optimal_llm_for_task(
                task,
                workflow_analysis['quality_assessments'][task.id]
            )
            execution_plan['llm_assignments'][task.id] = optimal_llm
            
            # Create fallback strategy
            fallback_strategy = await self.create_task_fallback_strategy(task, optimal_llm)
            execution_plan['fallback_strategies'][task.id] = fallback_strategy
        
        # Identify parallelization groups
        if workflow_definition.execution_strategy in ['parallel', 'adaptive', 'collaborative']:
            parallelization_groups = await self.create_parallelization_groups(
                dependency_graph,
                execution_plan['llm_assignments']
            )
            execution_plan['parallelization_groups'] = parallelization_groups
        
        # Apply optimization strategies
        optimization_strategies = await self.apply_optimization_strategies(
            workflow_definition,
            workflow_analysis,
            execution_plan
        )
        execution_plan['optimization_strategies'] = optimization_strategies
        
        # Create monitoring checkpoints
        monitoring_checkpoints = await self.create_monitoring_checkpoints(
            workflow_definition,
            execution_plan
        )
        execution_plan['monitoring_checkpoints'] = monitoring_checkpoints
        
        return execution_plan
    
    async def execute_sequential_workflow(self, workflow_definition, execution_plan, execution_session):
        """
        Execute workflow sequentially with optimal LLM routing
        """
        sequential_results = {
            'execution_type': 'sequential',
            'task_results': {},
            'execution_timeline': [],
            'performance_metrics': {}
        }
        
        current_context = execution_session['execution_context'].copy()
        
        for task_id in execution_plan['execution_order']:
            task = next(t for t in workflow_definition.tasks if t.id == task_id)
            
            # Start task execution
            task_start_time = datetime.utcnow()
            sequential_results['execution_timeline'].append({
                'task_id': task_id,
                'action': 'started',
                'timestamp': task_start_time
            })
            
            try:
                # Execute task with assigned LLM
                assigned_llm = execution_plan['llm_assignments'][task_id]
                task_result = await self.execute_single_task(
                    task,
                    assigned_llm,
                    current_context,
                    execution_plan
                )
                
                sequential_results['task_results'][task_id] = task_result
                
                # Update context with task outputs
                current_context.update(task_result.get('outputs', {}))
                
                # Record successful completion
                task_end_time = datetime.utcnow()
                sequential_results['execution_timeline'].append({
                    'task_id': task_id,
                    'action': 'completed',
                    'timestamp': task_end_time,
                    'duration': (task_end_time - task_start_time).total_seconds()
                })
                
            except Exception as e:
                # Handle task failure
                task_failure_time = datetime.utcnow()
                sequential_results['execution_timeline'].append({
                    'task_id': task_id,
                    'action': 'failed',
                    'timestamp': task_failure_time,
                    'error': str(e),
                    'duration': (task_failure_time - task_start_time).total_seconds()
                })
                
                # Attempt fallback strategy
                fallback_strategy = execution_plan['fallback_strategies'].get(task_id)
                if fallback_strategy:
                    fallback_result = await self.execute_fallback_strategy(
                        task,
                        fallback_strategy,
                        current_context,
                        e
                    )
                    
                    if fallback_result['success']:
                        sequential_results['task_results'][task_id] = fallback_result
                        current_context.update(fallback_result.get('outputs', {}))
                    else:
                        # Workflow failed
                        raise Exception(f"Task {task_id} failed and fallback unsuccessful: {e}")
                else:
                    # No fallback available
                    raise Exception(f"Task {task_id} failed with no fallback: {e}")
        
        return sequential_results
    
    async def execute_parallel_workflow(self, workflow_definition, execution_plan, execution_session):
        """
        Execute workflow with parallel task execution where possible
        """
        parallel_results = {
            'execution_type': 'parallel',
            'parallelization_groups': {},
            'task_results': {},
            'concurrency_metrics': {}
        }
        
        current_context = execution_session['execution_context'].copy()
        
        # Execute parallelization groups
        for group_id, group_tasks in enumerate(execution_plan['parallelization_groups']):
            group_start_time = datetime.utcnow()
            
            # Execute tasks in parallel
            parallel_tasks = []
            for task_id in group_tasks:
                task = next(t for t in workflow_definition.tasks if t.id == task_id)
                assigned_llm = execution_plan['llm_assignments'][task_id]
                
                task_coroutine = self.execute_single_task(
                    task,
                    assigned_llm,
                    current_context,
                    execution_plan
                )
                parallel_tasks.append((task_id, task_coroutine))
            
            # Wait for all tasks in group to complete
            group_results = {}
            try:
                # Execute tasks concurrently
                completed_tasks = await asyncio.gather(
                    *[task_coro for _, task_coro in parallel_tasks],
                    return_exceptions=True
                )
                
                # Process results
                for i, (task_id, _) in enumerate(parallel_tasks):
                    result = completed_tasks[i]
                    if isinstance(result, Exception):
                        # Handle task failure with fallback
                        fallback_strategy = execution_plan['fallback_strategies'].get(task_id)
                        if fallback_strategy:
                            task = next(t for t in workflow_definition.tasks if t.id == task_id)
                            fallback_result = await self.execute_fallback_strategy(
                                task,
                                fallback_strategy,
                                current_context,
                                result
                            )
                            group_results[task_id] = fallback_result
                        else:
                            raise result
                    else:
                        group_results[task_id] = result
                
                # Update context with all group outputs
                for task_result in group_results.values():
                    current_context.update(task_result.get('outputs', {}))
                
                parallel_results['parallelization_groups'][f'group_{group_id}'] = {
                    'tasks': group_tasks,
                    'results': group_results,
                    'start_time': group_start_time,
                    'end_time': datetime.utcnow(),
                    'duration': (datetime.utcnow() - group_start_time).total_seconds()
                }
                
                parallel_results['task_results'].update(group_results)
                
            except Exception as e:
                # Group failed
                parallel_results['parallelization_groups'][f'group_{group_id}'] = {
                    'tasks': group_tasks,
                    'error': str(e),
                    'start_time': group_start_time,
                    'end_time': datetime.utcnow(),
                    'duration': (datetime.utcnow() - group_start_time).total_seconds()
                }
                raise
        
        return parallel_results
    
    async def execute_single_task(self, task, assigned_llm, context, execution_plan):
        """
        Execute a single task using the assigned LLM
        """
        task_execution = {
            'task_id': task.id,
            'assigned_llm': assigned_llm,
            'start_time': datetime.utcnow(),
            'inputs': task.inputs.copy(),
            'outputs': {},
            'llm_response': None,
            'execution_metadata': {}
        }
        
        # Prepare task input with context
        task_input = {
            **task.inputs,
            'context': context,
            'task_type': task.task_type,
            'task_name': task.name
        }
        
        # Execute task using LLM interface
        try:
            llm_response = await self.llm_interface.execute_task({
                'type': task.task_type,
                'inputs': task_input,
                'llm_requirements': task.llm_requirements,
                'timeout': task.timeout or self.config['default_timeout']
            })
            
            task_execution['llm_response'] = llm_response
            task_execution['outputs'] = llm_response.get('result', {})
            task_execution['execution_metadata'] = llm_response.get('metadata', {})
            
            # Assess quality if quality assessor is available
            if hasattr(self, 'quality_assessor'):
                quality_score = await self.quality_assessor.assess_task_output(
                    task,
                    task_execution['outputs']
                )
                task_execution['quality_score'] = quality_score
            
            task_execution['status'] = 'completed'
            
        except Exception as e:
            task_execution['error'] = str(e)
            task_execution['status'] = 'failed'
            raise
        
        finally:
            task_execution['end_time'] = datetime.utcnow()
            task_execution['duration'] = (
                task_execution['end_time'] - task_execution['start_time']
            ).total_seconds()
        
        return task_execution
    
    async def execute_collaborative_workflow(self, workflow_definition, execution_plan, execution_session):
        """
        Execute workflow with multi-LLM collaboration
        """
        collaborative_results = {
            'execution_type': 'collaborative',
            'collaboration_sessions': {},
            'consensus_results': {},
            'task_results': {}
        }
        
        current_context = execution_session['execution_context'].copy()
        
        for task in workflow_definition.tasks:
            # Identify collaboration requirements
            collaboration_config = task.llm_requirements.get('collaboration', {})
            
            if collaboration_config.get('multi_llm', False):
                # Execute with multiple LLMs and build consensus
                collaboration_result = await self.execute_multi_llm_collaboration(
                    task,
                    collaboration_config,
                    current_context,
                    execution_plan
                )
                collaborative_results['collaboration_sessions'][task.id] = collaboration_result
                collaborative_results['task_results'][task.id] = collaboration_result['consensus_result']
                
                # Update context
                current_context.update(collaboration_result['consensus_result'].get('outputs', {}))
                
            else:
                # Execute normally with single LLM
                assigned_llm = execution_plan['llm_assignments'][task.id]
                task_result = await self.execute_single_task(
                    task,
                    assigned_llm,
                    current_context,
                    execution_plan
                )
                collaborative_results['task_results'][task.id] = task_result
                
                # Update context
                current_context.update(task_result.get('outputs', {}))
        
        return collaborative_results
    
    async def execute_multi_llm_collaboration(self, task, collaboration_config, context, execution_plan):
        """
        Execute task with multiple LLMs and build consensus
        """
        collaboration_session = {
            'task_id': task.id,
            'collaboration_type': collaboration_config.get('type', 'consensus'),
            'participating_llms': [],
            'individual_results': {},
            'consensus_result': {},
            'collaboration_metadata': {}
        }
        
        # Select participating LLMs
        num_llms = collaboration_config.get('num_llms', 3)
        participating_llms = await self.select_collaboration_llms(task, num_llms)
        collaboration_session['participating_llms'] = participating_llms
        
        # Execute task with each LLM
        llm_tasks = []
        for llm_provider in participating_llms:
            llm_task = self.execute_single_task(task, llm_provider, context, execution_plan)
            llm_tasks.append((llm_provider, llm_task))
        
        # Collect all results
        completed_results = await asyncio.gather(
            *[task_coro for _, task_coro in llm_tasks],
            return_exceptions=True
        )
        
        # Process individual results
        for i, (llm_provider, _) in enumerate(llm_tasks):
            result = completed_results[i]
            if not isinstance(result, Exception):
                collaboration_session['individual_results'][llm_provider] = result
        
        # Build consensus
        if collaboration_config.get('type') == 'consensus':
            consensus_result = await self.build_consensus_result(
                collaboration_session['individual_results'],
                task,
                collaboration_config
            )
        elif collaboration_config.get('type') == 'best_of_n':
            consensus_result = await self.select_best_result(
                collaboration_session['individual_results'],
                task,
                collaboration_config
            )
        elif collaboration_config.get('type') == 'ensemble':
            consensus_result = await self.create_ensemble_result(
                collaboration_session['individual_results'],
                task,
                collaboration_config
            )
        else:
            # Default to consensus
            consensus_result = await self.build_consensus_result(
                collaboration_session['individual_results'],
                task,
                collaboration_config
            )
        
        collaboration_session['consensus_result'] = consensus_result
        
        return collaboration_session

class TaskScheduler:
    """
    Intelligent task scheduling with optimization objectives
    """
    
    def __init__(self, config):
        self.config = config
        self.scheduling_strategies = {
            'priority_first': self.priority_first_scheduling,
            'cost_optimized': self.cost_optimized_scheduling,
            'latency_optimized': self.latency_optimized_scheduling,
            'balanced': self.balanced_scheduling
        }
    
    async def schedule_tasks(self, tasks, execution_strategy, optimization_objectives):
        """
        Schedule tasks based on strategy and optimization objectives
        """
        primary_objective = optimization_objectives[0] if optimization_objectives else 'balanced'
        
        if primary_objective in self.scheduling_strategies:
            scheduler = self.scheduling_strategies[primary_objective]
        else:
            scheduler = self.scheduling_strategies['balanced']
        
        return await scheduler(tasks, execution_strategy)
    
    async def priority_first_scheduling(self, tasks, execution_strategy):
        """
        Schedule tasks based on priority levels
        """
        # Sort tasks by priority (highest first)
        sorted_tasks = sorted(tasks, key=lambda t: t.priority.value, reverse=True)
        
        return [task.id for task in sorted_tasks]
    
    async def cost_optimized_scheduling(self, tasks, execution_strategy):
        """
        Schedule tasks to minimize overall cost
        """
        # This would integrate with cost estimation
        # For now, return simple priority-based scheduling
        return await self.priority_first_scheduling(tasks, execution_strategy)
    
    async def latency_optimized_scheduling(self, tasks, execution_strategy):
        """
        Schedule tasks to minimize overall latency
        """
        # Implement critical path scheduling
        # For now, return dependency-based ordering
        return await self.dependency_based_scheduling(tasks)
    
    async def dependency_based_scheduling(self, tasks):
        """
        Schedule tasks based on dependencies (topological sort)
        """
        # Create dependency graph
        graph = nx.DiGraph()
        
        for task in tasks:
            graph.add_node(task.id)
            for dependency in task.dependencies:
                graph.add_edge(dependency, task.id)
        
        # Topological sort
        try:
            scheduled_order = list(nx.topological_sort(graph))
            return scheduled_order
        except nx.NetworkXError:
            # Circular dependency detected
            raise ValueError("Circular dependency detected in workflow tasks")
```

### Workflow Engine Commands

```bash
# Workflow execution and management
bmad workflow execute --definition "workflow.yaml" --strategy "adaptive"
bmad workflow create --template "code-review" --customize
bmad workflow status --active --show-progress

# Multi-LLM collaboration
bmad workflow collaborate --task "architecture-design" --llms "claude,gpt4,gemini"
bmad workflow consensus --results "uuid1,uuid2,uuid3" --method "weighted"
bmad workflow ensemble --combine-outputs --quality-threshold 0.8

# Workflow optimization
bmad workflow optimize --objective "cost" --maintain-quality 0.8
bmad workflow analyze --performance --bottlenecks
bmad workflow route --tasks "auto" --capabilities-aware

# Workflow monitoring and analytics
bmad workflow monitor --real-time --alerts-enabled
bmad workflow metrics --execution-time --cost-efficiency
bmad workflow export --results "session-id" --format "detailed"
```

This Universal Workflow Orchestrator provides sophisticated workflow execution capabilities that work seamlessly with any LLM backend, enabling dynamic task routing, cost optimization, and multi-LLM collaboration patterns for complex development workflows.