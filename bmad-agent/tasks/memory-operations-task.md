# Memory Operations Task
<!-- Simplified task interface for memory operations -->
<!-- Full architecture: memory/memory-system-architecture.md -->

> **Note**: This is the executable memory operations task. For detailed integration guidance and implementation details, see `bmad-agent/memory/memory-system-architecture.md`.

## Purpose
Execute memory-aware context management for the current session, integrating historical insights and patterns to enhance decision-making and maintain continuity across interactions.

## Memory Categories & Schemas

### Decision Memories
**Schema**: `decision:{project}:{persona}:{timestamp}`
**Usage**: Track significant architectural, strategic, and tactical decisions with outcomes
**Content Structure**:
```json
{
  "type": "decision",
  "project": "project-name",
  "persona": "architect|pm|dev|etc",
  "decision": "chose-nextjs-over-react",
  "rationale": "better ssr support for seo requirements",
  "alternatives_considered": ["react+vite", "vue", "svelte"],
  "constraints": ["team-familiarity", "timeline", "seo-critical"],
  "outcome": "successful|problematic|unknown",
  "lessons": "nextjs learning curve was steeper than expected",
  "context_tags": ["frontend", "framework", "ssr", "seo"],
  "reusability_score": 0.8,
  "confidence_level": "high"
}
```

### Pattern Memories
**Schema**: `pattern:{workflow-type}:{success-indicator}`
**Usage**: Capture successful workflow patterns, sequences, and optimization insights
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
      "success_factors": ["clear-requirements", "defined-constraints"]
    }
  ],
  "success_indicators": {
    "time_to_first_code": "< 3 days",
    "architecture_stability": "no major changes after dev start",
    "user_satisfaction": "high"
  },
  "anti_patterns": ["skipping-po-validation", "architecture-without-prd"],
  "project_context": ["mvp", "startup", "web-app"],
  "effectiveness_score": 0.9
}
```

### Implementation Memories
**Schema**: `implementation:{technology}:{functionality}:{outcome}`
**Usage**: Track successful code patterns, debugging solutions, and technical approaches
**Content Structure**:
```json
{
  "type": "implementation",
  "technology_stack": ["nextjs", "typescript", "tailwind"],
  "functionality": "user-authentication",
  "approach": "jwt-with-refresh-tokens",
  "code_patterns": ["custom-hook-useAuth", "context-provider-pattern"],
  "challenges": ["token-refresh-timing", "secure-storage"],
  "solutions": ["axios-interceptor", "httponly-cookies"],
  "performance_impact": "minimal",
  "security_considerations": ["csrf-protection", "xss-prevention"],
  "testing_approach": ["unit-tests-auth-hook", "integration-tests-login-flow"],
  "maintenance_notes": "token expiry config needs environment-specific tuning",
  "success_metrics": {
    "implementation_time": "2 days",
    "bug_count": 0,
    "performance_score": 95
  }
}
```

### Consultation Memories
**Schema**: `consultation:{type}:{participants}:{outcome}`
**Usage**: Capture multi-persona consultation outcomes and collaborative insights
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
  "collaboration_effectiveness": 0.9,
  "decision_confidence": 0.8
}
```

### User Preference Memories
**Schema**: `preference:{user-context}:{preference-type}`
**Usage**: Learn individual working styles, preferences, and successful interaction patterns
**Content Structure**:
```json
{
  "type": "user-preference",
  "preference_category": "workflow-style",
  "preference": "detailed-technical-explanations",
  "context": "architecture-discussions",
  "evidence": ["requested-deep-dives", "positive-feedback-on-technical-detail"],
  "confidence": 0.7,
  "patterns": ["prefers-incremental-approach", "values-cross-references"],
  "adaptations": ["provide-more-technical-context", "include-implementation-examples"],
  "effectiveness": "high"
}
```

## Memory Operations Integration

### Intelligent Memory Queries
**Query Strategy Framework**:
```python
def build_contextual_memory_queries(current_context):
    queries = []
    
    # Direct relevance search
    if current_context.persona and current_context.task:
        queries.append(f"decisions involving {current_context.persona} and {extract_key_terms(current_context.task)}")
    
    # Pattern matching search  
    if current_context.project_phase and current_context.tech_stack:
        queries.append(f"successful patterns for {current_context.project_phase} with {current_context.tech_stack}")
    
    # Problem similarity search
    if current_context.blockers:
        queries.append(f"solutions for {current_context.blockers}")
    
    # Anti-pattern prevention
    queries.append(f"mistakes to avoid when {current_context.task} with {current_context.persona}")
    
    # Implementation guidance
    if current_context.implementation_context:
        queries.append(f"successful implementation {current_context.implementation_context}")
    
    return queries

def search_memory_with_context(queries, threshold=0.7):
    relevant_memories = []
    for query in queries:
        memories = search_memory(query, limit=3, threshold=threshold)
        relevant_memories.extend(memories)
    
    # Deduplicate and rank by relevance
    return deduplicate_and_rank(relevant_memories)
```

### Proactive Memory Surfacing
**Intelligence Categories**:
1. **Immediate Relevance**: Direct matches to current context
2. **Pattern Recognition**: Similar situations with successful outcomes
3. **Anti-Pattern Prevention**: Common mistakes in similar contexts
4. **Optimization Opportunities**: Performance/quality improvements from similar projects
5. **User Personalization**: Preferences and effective interaction patterns

### Memory Creation Automation
**Auto-Memory Triggers**:
```python
def auto_create_memory(event_type, content, context):
    memory_triggers = {
        "major_decision": lambda: create_decision_memory(content, context),
        "workflow_completion": lambda: create_pattern_memory(content, context),
        "successful_implementation": lambda: create_implementation_memory(content, context),
        "consultation_outcome": lambda: create_consultation_memory(content, context),
        "user_preference_signal": lambda: create_preference_memory(content, context),
        "problem_resolution": lambda: create_solution_memory(content, context),
        "lesson_learned": lambda: create_learning_memory(content, context)
    }
    
    if event_type in memory_triggers:
        memory_triggers[event_type]()
        
def create_contextual_memory_tags(content, context):
    tags = []
    
    # Automatic tagging based on content analysis
    tags.extend(extract_tech_terms(content))
    tags.extend(extract_domain_concepts(content))
    
    # Context-based tagging
    tags.append(f"phase:{context.phase}")
    tags.append(f"persona:{context.active_persona}")
    tags.append(f"project-type:{context.project_type}")
    
    # Semantic tagging for searchability
    tags.extend(generate_semantic_tags(content))
    
    return tags
```

## Context Restoration with Memory Enhancement

### Multi-Layer Context Assembly Process

#### Layer 1 - Immediate Session Context
```markdown
# 📍 Current Session State
**Project Phase**: {current_phase}
**Active Persona**: {current_persona} 
**Last Activity**: {last_completed_task}
**Pending Items**: {current_blockers_and_concerns}
**Session Duration**: {active_time}
```

#### Layer 2 - Historical Memory Context
```markdown
# 📚 Relevant Historical Context
**Similar Situations**: {count} relevant memories found
**Success Patterns**: 
- {pattern_1}: Used in {project_name} with {success_rate}% success
- {pattern_2}: Applied {usage_count} times with {outcome_summary}

**Lessons Learned**:
- ✅ **What worked**: {successful_approaches}
- ⚠️ **What to avoid**: {anti_patterns_and_pitfalls}
- 🔧 **Best practices**: {proven_optimization_approaches}
```

#### Layer 3 - Proactive Intelligence
```markdown
# 💡 Proactive Insights
**Optimization Opportunities**: {performance_improvements_based_on_similar_contexts}
**Risk Prevention**: {common_issues_to_watch_for}
**Personalized Recommendations**: {user_preference_based_suggestions}
**Cross-Project Learning**: {insights_from_similar_projects}
```

### Context Synthesis & Presentation
**Intelligent Summary Generation**:
```markdown
# 🧠 Memory-Enhanced Context for {Target Persona}

## Current Situation
**Project**: {project_name} | **Phase**: {current_phase}
**Last Activity**: {last_persona} completed {last_task}
**Context**: {brief_situation_summary}

## 🎯 Directly Relevant Memory Insights
{synthesized_relevant_context_from_memories}

## 📈 Success Pattern Application
**Recommended Approach**: {best_practice_pattern}
**Based On**: {similar_successful_contexts}
**Confidence**: {confidence_score}% (from {evidence_count} similar cases)

## ⚠️ Proactive Warnings
**Potential Issues**: {common_pitfalls_for_context}
**Prevention Strategy**: {proven_avoidance_approaches}

## 🚀 Optimization Opportunities
**Performance**: {performance_improvement_suggestions}
**Efficiency**: {workflow_optimization_opportunities}
**Quality**: {quality_enhancement_recommendations}

## ❓ Contextual Questions
Based on memory patterns, consider:
1. {contextual_question_1}
2. {contextual_question_2}

---
💬 **Memory Query**: Ask "What do you remember about..." or "Show me patterns for..."
```

## Memory System Integration Instructions

### For OpenMemory MCP Integration:
```python
# Memory function usage patterns
def integrate_memory_with_bmad_operations():
    # Store significant events
    add_memories(
        content="decision: chose postgresql for primary database",
        tags=["database", "architecture", "postgresql"],
        metadata={
            "project": current_project,
            "persona": "architect", 
            "confidence": 0.9,
            "reusability": 0.8
        }
    )
    
    # Retrieve contextual information
    relevant_context = search_memory(
        "database choice postgresql architecture decision",
        limit=5,
        threshold=0.7
    )
    
    # Browse related memories
    all_architecture_memories = list_memories(
        filter_tags=["architecture", "database"],
        limit=10
    )
```

### Error Handling & Fallback:
```python
def memory_enhanced_operation_with_fallback():
    try:
        # Attempt memory-enhanced operation
        memory_context = search_memory(current_context_query)
        return enhanced_operation_with_memory(memory_context)
    except MemoryUnavailableError:
        # Graceful fallback to standard operation
        log_memory_unavailable()
        return standard_operation_with_session_state()
    except Exception as e:
        # Handle other memory-related errors
        log_memory_error(e)
        return fallback_operation()
```

## Quality Assurance & Learning Integration

### Memory Quality Metrics:
- **Relevance Score**: How well memory matches current context
- **Effectiveness Score**: Success rate of applied memory insights
- **Reusability Score**: How often memory is successfully applied across contexts
- **Confidence Level**: Reliability of memory-based recommendations
- **Learning Rate**: How quickly system improves from memory integration

### Continuous Learning Process:
1. **Memory Application Tracking**: Monitor which memory insights are used and their outcomes
2. **Effectiveness Analysis**: Measure success rates of memory-enhanced operations vs. standard operations
3. **Pattern Refinement**: Update successful patterns based on new outcomes
4. **Anti-Pattern Detection**: Identify and flag emerging failure modes
5. **User Adaptation**: Learn individual preferences and adapt memory surfacing accordingly

### Memory Maintenance:
- **Consolidation**: Merge similar memories and extract higher-level patterns
- **Validation**: Verify memory accuracy against real outcomes
- **Pruning**: Remove outdated or ineffective memory entries
- **Enhancement**: Enrich memories with additional context and outcomes
- **Cross-Reference**: Build connections between related memories for better retrieval