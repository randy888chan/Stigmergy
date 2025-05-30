# Memory-Enhanced Context Restoration Task

## Purpose
Intelligently restore context using both session state and accumulated memory insights to provide comprehensive, actionable context for persona activation and task execution.

## Multi-Layer Context Restoration Process

### 1. Session State Analysis
**Immediate Context Loading**:
```python
def load_session_context():
    session_state = load_file('.ai/orchestrator-state.md')
    return {
        "project_name": extract_project_name(session_state),
        "current_phase": extract_current_phase(session_state),
        "active_personas": extract_persona_history(session_state),
        "recent_decisions": extract_decision_log(session_state),
        "pending_items": extract_blockers_and_concerns(session_state),
        "last_activity": extract_last_activity(session_state),
        "session_duration": calculate_session_duration(session_state)
    }
```

### 2. Memory Intelligence Integration
**Historical Context Queries**:
```python
def gather_memory_intelligence(session_context, target_persona):
    memory_queries = []
    
    # Direct persona relevance
    memory_queries.append(f"{target_persona} successful patterns {session_context.project_type}")
    
    # Current phase insights
    memory_queries.append(f"{session_context.current_phase} challenges solutions {target_persona}")
    
    # Pending items resolution
    if session_context.pending_items:
        memory_queries.append(f"solutions for {session_context.pending_items}")
    
    # Cross-project learning
    memory_queries.append(f"successful {target_persona} approaches {session_context.tech_context}")
    
    # Anti-pattern prevention
    memory_queries.append(f"common mistakes {target_persona} {session_context.current_phase}")
    
    return execute_memory_queries(memory_queries)

def execute_memory_queries(queries):
    memory_insights = {
        "relevant_patterns": [],
        "success_strategies": [],
        "anti_patterns": [],
        "optimization_opportunities": [],
        "personalization_insights": []
    }
    
    for query in queries:
        memories = search_memory(query, limit=3, threshold=0.7)
        categorize_memories(memories, memory_insights)
    
    return memory_insights
```

### 3. Proactive Intelligence Generation
**Intelligent Anticipation**:
```python
def generate_proactive_insights(session_context, memory_insights, target_persona):
    proactive_intelligence = {}
    
    # Predict likely next actions
    proactive_intelligence["likely_next_actions"] = predict_next_actions(
        session_context, memory_insights, target_persona
    )
    
    # Identify potential roadblocks
    proactive_intelligence["potential_issues"] = identify_potential_issues(
        session_context, memory_insights
    )
    
    # Suggest optimizations
    proactive_intelligence["optimization_opportunities"] = suggest_optimizations(
        session_context, memory_insights
    )
    
    # Personalize recommendations
    proactive_intelligence["personalized_suggestions"] = personalize_recommendations(
        session_context, target_persona
    )
    
    return proactive_intelligence
```

## Context Presentation Templates

### Enhanced Context Briefing for Persona Activation
```markdown
# 🧠 Memory-Enhanced Context Restoration for {Target Persona}

## 📍 Current Project State
**Project**: {project_name} | **Phase**: {current_phase} | **Duration**: {session_duration}
**Last Activity**: {last_persona} completed {last_task} {time_ago}
**Progress Status**: {completion_percentage}% through {current_epic}

## 🎯 Your Role Context
**Activation Reason**: {why_this_persona_now}
**Expected Contribution**: {anticipated_value_from_persona}
**Key Stakeholders**: {relevant_other_personas_and_user}

## 📚 Relevant Memory Intelligence
### Successful Patterns (from {similar_situations_count} similar cases)
- ✅ **{Success Pattern 1}**: Applied in {project_example} with {success_metric}
- ✅ **{Success Pattern 2}**: Used {usage_frequency} times with {average_outcome}
- ✅ **{Success Pattern 3}**: Proven effective for {context_specifics}

### Lessons Learned
- ⚠️ **Avoid**: {anti_pattern} (caused issues in {failure_count} cases)
- 🔧 **Best Practice**: {optimization_approach} (improved outcomes by {improvement_metric})
- 💡 **Insight**: {strategic_insight} (discovered from {learning_source})

## 🚀 Proactive Recommendations
### Immediate Actions
1. **{Priority Action 1}** - {rationale_with_memory_support}
2. **{Priority Action 2}** - {rationale_with_memory_support}

### Optimization Opportunities
- **{Optimization 1}**: {memory_based_suggestion}
- **{Optimization 2}**: {efficiency_improvement}

### Potential Issues to Watch
- **{Risk 1}**: {early_warning_signs} → **Prevention**: {mitigation_strategy}
- **{Risk 2}**: {indicators_to_monitor} → **Response**: {response_plan}

## 🎨 Personalization Insights
**Your Working Style**: {learned_preferences}
**Effective Approaches**: {what_works_well_for_user}
**Communication Preferences**: {optimal_interaction_style}

## ❓ Contextual Questions for Validation
Based on memory patterns, please confirm:
1. {context_validation_question_1}
2. {context_validation_question_2}
3. {preference_confirmation_question}

---
💬 **Memory Access**: Use `/recall {topic}` or ask "What do you remember about..."
🔍 **Deep Dive**: Use `/insights` for additional proactive intelligence
```

### Lightweight Context Summary (for experienced users)
```markdown
# ⚡ Quick Context for {Target Persona}

**Current**: {project_phase} | **Last**: {previous_activity}
**Memory Insights**: {key_pattern} proven in {success_cases} similar cases
**Recommended**: {next_action} based on {success_probability}% success rate
**Watch For**: {primary_risk} (early signs: {warning_indicators})

**Ready to proceed with {suggested_approach}?**
```

## Context Restoration Intelligence

### Pattern Recognition Engine
```python
def recognize_context_patterns(session_context, memory_base):
    pattern_analysis = {
        "workflow_stage": classify_workflow_stage(session_context),
        "success_probability": calculate_success_probability(session_context, memory_base),
        "risk_assessment": assess_contextual_risks(session_context, memory_base),
        "optimization_potential": identify_optimization_opportunities(session_context),
        "user_alignment": assess_user_preference_alignment(session_context)
    }
    
    return pattern_analysis

def classify_workflow_stage(session_context):
    stage_indicators = {
        "project_initiation": ["no_prd", "analyst_activity", "brainstorming"],
        "requirements_definition": ["prd_draft", "pm_activity", "scope_discussion"],
        "architecture_design": ["architect_activity", "tech_decisions", "component_design"],
        "development_preparation": ["po_activity", "story_creation", "validation"],
        "active_development": ["dev_activity", "implementation", "testing"],
        "refinement_cycle": ["multiple_persona_switches", "iterative_changes"]
    }
    
    return match_stage_indicators(session_context, stage_indicators)
```

### Success Prediction Algorithm
```python
def calculate_success_probability(current_context, memory_insights):
    success_factors = {
        "pattern_match_strength": calculate_pattern_similarity(current_context, memory_insights),
        "context_completeness": assess_context_completeness(current_context),
        "resource_availability": evaluate_resource_readiness(current_context),
        "risk_mitigation": assess_risk_preparation(current_context, memory_insights),
        "user_engagement": evaluate_user_engagement_patterns(current_context)
    }
    
    weighted_score = calculate_weighted_success_score(success_factors)
    confidence_interval = calculate_confidence_interval(memory_insights.sample_size)
    
    return {
        "success_probability": weighted_score,
        "confidence": confidence_interval,
        "key_factors": identify_critical_success_factors(success_factors),
        "improvement_opportunities": suggest_probability_improvements(success_factors)
    }
```

## Memory Creation During Context Restoration

### Context Restoration Outcome Tracking
```python
def track_context_restoration_effectiveness():
    restoration_memory = {
        "type": "context_restoration",
        "session_context": current_session_state,
        "memory_insights_provided": memory_intelligence_summary,
        "persona_activation_success": measure_activation_effectiveness(),
        "user_satisfaction": capture_user_feedback(),
        "task_completion_improvement": measure_efficiency_gains(),
        "accuracy_of_predictions": validate_proactive_insights(),
        "learning_opportunities": identify_restoration_improvements()
    }
    
    add_memories(restoration_memory, tags=["context-restoration", "effectiveness", "learning"])
```

### Proactive Intelligence Validation
```python
def validate_proactive_insights(provided_insights, actual_outcomes):
    validation_results = {}
    
    for insight_type, predictions in provided_insights.items():
        validation_results[insight_type] = {
            "accuracy": calculate_prediction_accuracy(predictions, actual_outcomes),
            "usefulness": measure_insight_application_rate(predictions),
            "impact": assess_outcome_improvement(predictions, actual_outcomes)
        }
    
    # Update memory intelligence based on validation
    update_proactive_intelligence_patterns(validation_results)
    
    return validation_results
```

## Integration with Persona Activation

### Pre-Activation Context Assembly
```python
def prepare_persona_activation_context(target_persona, session_state):
    # 1. Load immediate session context
    immediate_context = load_session_context()
    
    # 2. Gather memory intelligence
    memory_intelligence = gather_memory_intelligence(immediate_context, target_persona)
    
    # 3. Generate proactive insights
    proactive_insights = generate_proactive_insights(
        immediate_context, memory_intelligence, target_persona
    )
    
    # 4. Synthesize comprehensive context
    comprehensive_context = synthesize_context(
        immediate_context, memory_intelligence, proactive_insights
    )
    
    # 5. Personalize for target persona
    personalized_context = personalize_context(comprehensive_context, target_persona)
    
    return personalized_context
```

### Post-Activation Context Validation
```python
def validate_context_restoration_success(persona_response, user_feedback):
    validation_metrics = {
        "context_completeness": assess_context_gaps(persona_response),
        "memory_insight_relevance": evaluate_memory_application(persona_response),
        "proactive_intelligence_value": measure_proactive_insight_usage(persona_response),
        "user_satisfaction": capture_user_satisfaction(user_feedback),
        "efficiency_improvement": measure_time_to_productivity(persona_response)
    }
    
    # Create learning memory for future context restoration improvement
    create_context_restoration_learning_memory(validation_metrics)
    
    return validation_metrics
```

## Error Handling & Fallback Strategies

### Memory System Unavailable
```python
def fallback_context_restoration():
    # Enhanced session state analysis
    enhanced_session_context = analyze_session_state_deeply()
    
    # Pattern recognition from session data
    local_patterns = extract_patterns_from_session()
    
    # Heuristic-based recommendations
    heuristic_insights = generate_heuristic_insights(enhanced_session_context)
    
    # Clear capability communication
    communicate_reduced_capability_scope()
    
    return create_fallback_context_briefing(
        enhanced_session_context, local_patterns, heuristic_insights
    )
```

### Memory Query Failures
```python
def handle_memory_query_failures(failed_queries, session_context):
    # Attempt alternative query formulations
    alternative_queries = reformulate_queries(failed_queries)
    
    # Use cached memory insights if available
    cached_insights = retrieve_cached_memory_insights(session_context)
    
    # Generate context with available information
    partial_context = create_partial_context(cached_insights, session_context)
    
    # Flag limitations clearly
    flag_context_limitations(failed_queries)
    
    return partial_context
```

## Quality Assurance & Continuous Improvement

### Context Quality Metrics
- **Relevance Score**: How well memory insights match current context needs
- **Completeness Score**: Coverage of important contextual factors
- **Accuracy Score**: Correctness of proactive predictions and insights
- **Usefulness Score**: Practical value of context information for persona activation
- **Efficiency Score**: Time saved through effective context restoration

### Continuous Learning Integration
```python
def continuous_context_restoration_learning():
    # Analyze recent context restoration outcomes
    recent_restorations = get_recent_context_restorations()
    
    # Identify improvement patterns
    improvement_opportunities = analyze_restoration_effectiveness(recent_restorations)
    
    # Update context restoration algorithms
    update_context_intelligence(improvement_opportunities)
    
    # Refine memory query strategies
    optimize_memory_query_patterns(recent_restorations)
    
    # Enhance proactive intelligence generation
    improve_proactive_insight_algorithms(recent_restorations)
```