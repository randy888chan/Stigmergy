# Memory-Orchestrated Context Management

## Purpose
Seamlessly integrate OpenMemory for intelligent context persistence and retrieval across all BMAD operations, providing cognitive load reduction through learning and pattern recognition.

## Memory Categories & Schemas

### 1. Decision Memories
**Schema**: `decision:{project}:{persona}:{timestamp}`
**Purpose**: Track architectural and strategic choices with outcomes
**Content Structure**:
```json
{
  "type": "decision",
  "project": "project-name",
  "persona": "architect|pm|dev|design-architect|po|sm|analyst",
  "decision": "chose-nextjs-over-react",
  "rationale": "better ssr support for seo requirements",
  "alternatives_considered": ["react+vite", "vue", "svelte"],
  "constraints": ["team-familiarity", "timeline", "seo-critical"],
  "outcome": "successful|problematic|unknown|in-progress",
  "lessons": "nextjs learning curve was steeper than expected",
  "context_tags": ["frontend", "framework", "ssr", "seo"],
  "follow_up_needed": false,
  "confidence_level": 85,
  "implementation_notes": "migration took 2 extra days due to routing complexity"
}
```

### 2. Pattern Memories
**Schema**: `pattern:{workflow-type}:{success-indicator}`
**Purpose**: Capture successful workflow sequences and anti-patterns
**Content Structure**:
```json
{
  "type": "workflow-pattern",
  "workflow": "new-project-mvp",
  "sequence": ["analyst", "pm", "architect", "design-architect", "po", "sm", "dev"],
  "decision_points": [
    {
      "stage": "pm-to-architect",
      "common_questions": ["monorepo vs polyrepo", "database choice"],
      "success_factors": ["clear-requirements", "defined-constraints"],
      "failure_indicators": ["rushed-handoff", "unclear-scope"]
    }
  ],
  "success_indicators": {
    "time_to_first_code": "< 3 days",
    "architecture_stability": "no major changes after dev start",
    "user_satisfaction": "high",
    "technical_debt": "low"
  },
  "anti_patterns": ["skipping-po-validation", "architecture-without-prd"],
  "context_requirements": ["clear-goals", "defined-constraints", "user-research"],
  "optimization_opportunities": ["parallel-work", "early-validation"]
}
```

### 3. Consultation Memories
**Schema**: `consultation:{type}:{participants}:{outcome}`
**Purpose**: Learn from multi-persona collaboration patterns
**Content Structure**:
```json
{
  "type": "consultation",
  "consultation_type": "design-review",
  "participants": ["pm", "architect", "design-architect"],
  "problem": "database scaling for real-time features",
  "perspectives": {
    "pm": "user-experience priority, cost concerns",
    "architect": "technical feasibility, performance requirements", 
    "design-architect": "ui responsiveness, loading states"
  },
  "consensus": "implement caching layer with websockets",
  "minority_opinions": ["architect preferred event-sourcing approach"],
  "implementation_success": true,
  "follow_up_needed": false,
  "reusable_insights": ["caching-before-scaling", "websocket-ui-patterns"],
  "time_to_resolution": "40 minutes",
  "satisfaction_score": 8.5
}
```

### 4. User Preference Memories
**Schema**: `user-preference:{category}:{pattern}`
**Purpose**: Learn individual working style and optimize recommendations
**Content Structure**:
```json
{
  "type": "user-preference",
  "category": "workflow-style",
  "pattern": "prefers-detailed-planning",
  "evidence": [
    "always runs PO checklist before development",
    "requests comprehensive architecture before coding",
    "frequently uses doc-sharding for organization"
  ],
  "confidence": 0.85,
  "exceptions": ["emergency-fixes", "prototype-development"],
  "optimization_suggestions": [
    "auto-suggest-checklist-runs",
    "proactive-architecture-review"
  ],
  "last_validated": "2024-01-15T10:30:00Z"
}
```

### 5. Problem-Solution Memories
**Schema**: `problem-solution:{domain}:{solution-type}`
**Purpose**: Track effective solutions for recurring problems
**Content Structure**:
```json
{
  "type": "problem-solution",
  "domain": "frontend-performance",
  "problem": "slow initial page load with large component tree",
  "solution": "implemented code splitting with React.lazy",
  "implementation_details": {
    "approach": "route-based splitting + component-level lazy loading",
    "libraries": ["react", "react-router-dom"],
    "complexity": "medium",
    "time_investment": "2 days"
  },
  "outcome": {
    "performance_improvement": "60% faster initial load",
    "maintenance_impact": "minimal",
    "user_satisfaction": "high"
  },
  "reusability": "high",
  "prerequisites": ["react-16.6+", "proper-bundler-config"],
  "related_problems": ["component-tree-depth", "bundle-size"]
}
```

## Memory Operations Integration

### Context Restoration with Memory Search
```python
def restore_enhanced_context(target_persona, current_session_state):
    # Layer 1: Immediate session context
    immediate_context = load_session_state()
    
    # Layer 2: Historical memory search
    memory_queries = [
        f"decisions involving {target_persona} and {extract_key_terms(current_task)}",
        f"successful patterns for {current_project_state.phase} with {current_project_state.tech_stack}",
        f"user preferences for {target_persona} workflows",
        f"problem solutions for {current_project_state.domain}"
    ]
    
    historical_insights = []
    for query in memory_queries:
        memories = search_memory(query, limit=3, threshold=0.7)
        historical_insights.extend(memories)
    
    # Layer 3: Proactive intelligence
    proactive_queries = [
        f"lessons learned from {similar_projects}",
        f"common mistakes in {current_project_state.phase}",
        f"optimization opportunities for {current_workflow}"
    ]
    
    proactive_insights = search_memory_aggregated(proactive_queries)
    
    # Synthesize and present
    return synthesize_context_briefing(
        immediate_context, 
        historical_insights, 
        proactive_insights,
        target_persona
    )
```

### Auto-Memory Creation Triggers
**Major Decision Points**:
```python
def auto_create_decision_memory(decision_context):
    if is_major_decision(decision_context):
        memory_content = {
            "type": "decision",
            "project": get_current_project(),
            "persona": decision_context.active_persona,
            "decision": decision_context.choice_made,
            "rationale": decision_context.reasoning,
            "alternatives_considered": decision_context.other_options,
            "constraints": extract_constraints(decision_context),
            "timestamp": now(),
            "confidence_level": assess_confidence(decision_context)
        }
        
        add_memories(
            content=json.dumps(memory_content),
            tags=generate_decision_tags(memory_content),
            metadata={"type": "decision", "auto_created": True}
        )
```

**Successful Workflow Completions**:
```python
def auto_create_pattern_memory(workflow_completion):
    pattern_memory = {
        "type": "workflow-pattern",
        "workflow": workflow_completion.workflow_type,
        "sequence": workflow_completion.persona_sequence,
        "success_indicators": extract_success_metrics(workflow_completion),
        "duration": workflow_completion.total_time,
        "efficiency_score": calculate_efficiency(workflow_completion),
        "user_satisfaction": workflow_completion.satisfaction_rating
    }
    
    add_memories(
        content=json.dumps(pattern_memory),
        tags=generate_pattern_tags(pattern_memory),
        metadata={"type": "pattern", "reusability": "high"}
    )
```

**Problem Resolution Outcomes**:
```python
def auto_create_solution_memory(problem_resolution):
    solution_memory = {
        "type": "problem-solution",
        "domain": problem_resolution.domain,
        "problem": problem_resolution.problem_description,
        "solution": problem_resolution.solution_implemented,
        "outcome": problem_resolution.measured_results,
        "reusability": assess_reusability(problem_resolution),
        "complexity": problem_resolution.implementation_complexity
    }
    
    add_memories(
        content=json.dumps(solution_memory),
        tags=generate_solution_tags(solution_memory),
        metadata={"type": "solution", "effectiveness": solution_memory.outcome.success_rate}
    )
```

## Proactive Intelligence System

### Pattern Recognition Engine
```python
def recognize_emerging_patterns():
    recent_memories = search_memory(
        "decision outcome pattern",
        time_filter="last_30_days",
        limit=50
    )
    
    patterns = {
        "successful_approaches": identify_success_patterns(recent_memories),
        "emerging_anti_patterns": identify_failure_patterns(recent_memories),
        "efficiency_trends": analyze_efficiency_trends(recent_memories),
        "user_adaptation": track_user_behavior_changes(recent_memories)
    }
    
    return patterns
```

### Proactive Warning System
```python
def generate_proactive_warnings(current_context):
    # Search for similar contexts that led to problems
    problem_memories = search_memory(
        f"problem {current_context.phase} {current_context.persona} {current_context.task_type}",
        limit=5,
        threshold=0.7
    )
    
    warnings = []
    for memory in problem_memories:
        if similarity_score(current_context, memory.context) > 0.8:
            warnings.append({
                "warning": memory.problem_description,
                "prevention": memory.prevention_strategy,
                "early_indicators": memory.warning_signs,
                "confidence": calculate_warning_confidence(memory, current_context)
            })
    
    return warnings
```

### Intelligent Suggestion Engine
```python
def generate_intelligent_suggestions(current_state):
    # Multi-factor suggestion generation
    suggestions = []
    
    # Historical success patterns
    success_patterns = search_memory(
        f"successful {current_state.phase} {current_state.project_type}",
        limit=5,
        threshold=0.8
    )
    
    for pattern in success_patterns:
        if is_applicable(pattern, current_state):
            suggestions.append({
                "type": "success_pattern",
                "suggestion": pattern.approach,
                "confidence": pattern.success_rate,
                "rationale": pattern.why_it_worked
            })
    
    # User preference patterns
    user_prefs = search_memory(
        f"user-preference {current_state.active_persona}",
        limit=3,
        threshold=0.9
    )
    
    for pref in user_prefs:
        suggestions.append({
            "type": "personalized",
            "suggestion": pref.preferred_approach,
            "confidence": pref.confidence,
            "rationale": f"Based on your working style: {pref.pattern}"
        })
    
    # Optimization opportunities
    optimizations = search_memory(
        f"optimization {current_state.workflow_type}",
        limit=3,
        threshold=0.7
    )
    
    for opt in optimizations:
        suggestions.append({
            "type": "optimization",
            "suggestion": opt.improvement,
            "confidence": opt.effectiveness,
            "rationale": f"Could save: {opt.time_savings}"
        })
    
    return rank_suggestions(suggestions)
```

## Memory Quality Management

### Memory Validation & Cleanup
```python
def validate_memory_quality():
    # Find outdated memories
    outdated = search_memory(
        "decision outcome",
        time_filter="older_than_90_days",
        limit=100
    )
    
    for memory in outdated:
        # Validate if still relevant
        if not is_still_relevant(memory):
            archive_memory(memory)
        elif needs_update(memory):
            update_memory_with_new_insights(memory)
    
    # Identify conflicting memories
    conflicts = detect_memory_conflicts()
    for conflict in conflicts:
        resolve_memory_conflict(conflict)
```

### Memory Consolidation
```python
def consolidate_memories():
    # Weekly consolidation process
    related_memories = group_related_memories()
    
    for group in related_memories:
        if should_consolidate(group):
            consolidated = create_consolidated_memory(group)
            replace_memories(group, consolidated)
```

## Integration with BMAD Operations

### Enhanced Persona Briefings
```markdown
# 🧠 Memory-Enhanced Briefing for {Persona}

## Relevant Experience
**From Similar Situations**:
- {relevant_memory_1.summary}
- {relevant_memory_2.summary}

**What Usually Works**:
- {success_pattern_1}
- {success_pattern_2}

**What to Avoid**:
- {anti_pattern_1}
- {anti_pattern_2}

## Your Working Style
**Based on past interactions**:
- You typically prefer: {user_preference_1}
- You're most effective when: {optimal_conditions}
- Watch out for: {personal_pitfall_patterns}

## Proactive Insights
⚠️ **Potential Issues**: {proactive_warnings}
💡 **Optimization Opportunities**: {efficiency_suggestions}
🎯 **Success Factors**: {recommended_approaches}
```

### Memory-Enhanced Decision Support
```markdown
# 🤔 Memory-Enhanced Decision Support

## Similar Past Decisions
**{Similar Decision 1}** (Confidence: {similarity}%)
- **Chosen**: {past_choice}
- **Outcome**: {past_outcome}
- **Lesson**: {key_learning}

## Pattern Analysis
**Success Rate by Option**:
- Option A: {success_rate}% (based on {n} cases)
- Option B: {success_rate}% (based on {n} cases)

## Recommendation
**Suggested**: {memory_based_recommendation}
**Confidence**: {confidence_level}%
**Rationale**: {evidence_from_memory}
```

## Memory Commands Integration

### Available Memory Commands
```bash
# Core memory operations
/remember <content>          # Manually add important memories
/recall <query>             # Search memories with natural language
/insights                   # Get proactive insights for current context
/patterns                   # Show recognized patterns in working style

# Analysis and optimization
/memory-analyze             # Analyze memory patterns and quality
/learn                      # Process recent outcomes and update intelligence
/consolidate               # Run memory consolidation process
/cleanup                   # Archive outdated memories

# Specific memory types
/remember-decision <details> # Log a specific decision with context
/remember-lesson <content>   # Log a lesson learned
/remember-preference <pref>  # Update user preference memory
/remember-solution <sol>     # Log a successful problem solution
```

### Memory Command Implementations
```python
def handle_memory_commands(command, args, current_context):
    if command == "/remember":
        return manual_memory_creation(args, current_context)
    elif command == "/recall":
        return memory_search_interface(args)
    elif command == "/insights":
        return generate_proactive_insights(current_context)
    elif command == "/patterns":
        return analyze_user_patterns(current_context.user_id)
    elif command == "/learn":
        return run_learning_cycle()
    # ... implement other commands
```

This memory orchestration system transforms BMAD from a stateless process into an intelligent, learning development companion that accumulates wisdom and provides increasingly sophisticated guidance over time.