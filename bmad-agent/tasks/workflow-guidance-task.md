# Workflow Guidance Task

## Purpose
Provide intelligent workflow suggestions based on current project state, memory patterns, and BMAD best practices. Optionally store workflow guidance outputs at `.ai/guidance/workflow/` for future reference.

## Memory-Enhanced Workflow Analysis

### 1. Current State Assessment
```python
# Assess current project state
def analyze_current_state():
    session_state = load_session_state()
    project_artifacts = scan_project_artifacts()
    
    # Search memory for similar project states
    similar_states = search_memory(
        f"project state {session_state.phase} {project_artifacts.completion_level}",
        limit=5,
        threshold=0.7
    )
    
    return {
        "current_phase": session_state.phase,
        "artifacts_present": project_artifacts.files,
        "completion_level": project_artifacts.completion_percentage,
        "similar_experiences": similar_states,
        "typical_next_steps": extract_next_steps(similar_states)
    }
```

### 2. Workflow Pattern Recognition
**Pattern Analysis**:
- Load workflow patterns from memory and standard templates
- Identify current position in common workflows
- Detect deviations from successful patterns
- Suggest course corrections based on past outcomes

**Memory Queries**:
```python
workflow_memories = search_memory(
    f"workflow {project_type} successful completion",
    limit=10,
    threshold=0.6
)

failure_patterns = search_memory(
    f"workflow problems mistakes {current_phase}",
    limit=5,
    threshold=0.7
)
```

### 3. Intelligent Workflow Recommendations

#### New Project Flow Detection
**Indicators**:
- No PRD exists
- Project brief recently created or missing
- Empty or minimal docs/ directory
- No established architecture

**Memory-Enhanced Recommendations**:
```markdown
🎯 **Detected: New Project Workflow**

## Recommended Path (Based on {N} similar successful projects)
1. **Analysis Phase**: Analyst → Project Brief
2. **Requirements Phase**: PM → PRD Creation  
3. **Architecture Phase**: Architect → Technical Design
4. **UI/UX Phase** (if applicable): Design Architect → Frontend Spec
5. **Validation Phase**: PO → Master Checklist
6. **Development Prep**: SM → Story Creation
7. **Implementation Phase**: Dev → Code Development

## Memory Insights
✅ **What typically works**: {successful_patterns_from_memory}
⚠️ **Common pitfalls to avoid**: {failure_patterns_from_memory}
🚀 **Optimization opportunities**: {efficiency_patterns_from_memory}

## Your Historical Patterns
Based on your past projects:
- You typically prefer: {user_pattern_preferences}
- Your most productive flow: {user_successful_sequences}
- Watch out for: {user_common_challenges}
```

#### Feature Addition Flow Detection
**Indicators**:
- Existing architecture and PRD
- Request for new functionality
- Stable codebase present

**Memory-Enhanced Recommendations**:
```markdown
🔧 **Detected: Feature Addition Workflow**

## Streamlined Path (Based on {N} similar feature additions)
1. **Impact Analysis**: Architect → Technical Feasibility
2. **Feature Specification**: PM → Feature PRD Update
3. **Implementation Planning**: SM → Story Breakdown
4. **Development**: Dev → Feature Implementation

## Similar Feature Memories
📊 **Past feature additions to {similar_project_type}**:
- Average timeline: {timeline_from_memory}
- Success factors: {success_factors_from_memory}
- Technical challenges: {common_challenges_from_memory}
```

#### Course Correction Flow Detection
**Indicators**:
- Blocking issues identified
- Major requirement changes
- Architecture conflicts discovered
- Multiple failed story attempts

**Memory-Enhanced Recommendations**:
```markdown
🚨 **Detected: Course Correction Needed**

## Recovery Path (Based on {N} similar recovery situations)
1. **Problem Assessment**: PO → Change Checklist
2. **Impact Analysis**: PM + Architect → Joint Review
3. **Solution Design**: Multi-Persona Consultation
4. **Re-planning**: Updated artifacts based on decisions

## Recovery Patterns from Memory
🔄 **Similar situations resolved by**:
- {recovery_pattern_1}: {success_rate}% success rate
- {recovery_pattern_2}: {success_rate}% success rate

⚠️ **Recovery anti-patterns to avoid**:
- {anti_pattern_1}: Led to {negative_outcome}
- {anti_pattern_2}: Caused {time_waste}
```

### 4. Persona Sequence Optimization

#### Memory-Based Persona Suggestions
```python
def suggest_next_persona(current_state, memory_patterns):
    # Analyze successful persona transitions
    successful_transitions = search_memory(
        f"handoff {current_state.last_persona} successful {current_state.phase}",
        limit=10,
        threshold=0.7
    )
    
    # Calculate transition success rates
    next_personas = {}
    for transition in successful_transitions:
        next_persona = transition.next_persona
        success_rate = calculate_success_rate(transition.outcomes)
        next_personas[next_persona] = success_rate
    
    # Sort by success rate and contextual relevance
    return sorted(next_personas.items(), key=lambda x: x[1], reverse=True)
```

#### Persona Transition Recommendations
```markdown
## 🎭 Next Persona Suggestions

### High Confidence ({confidence}%)
**{Top Persona}** - {reasoning_from_memory}
- **Why now**: {contextual_reasoning}
- **Expected outcome**: {predicted_outcome}
- **Timeline**: ~{estimated_duration}

### Alternative Options
**{Alternative 1}** ({confidence}%) - {brief_reasoning}
**{Alternative 2}** ({confidence}%) - {brief_reasoning}

### ⚠️ Transition Considerations
Based on memory patterns:
- **Ensure**: {prerequisite_check}
- **Prepare**: {preparation_suggestion}
- **Watch for**: {potential_issue_warning}
```

### 5. Progress Tracking & Optimization

#### Workflow Milestone Tracking
```python
def track_workflow_progress(current_workflow, session_state):
    milestones = get_workflow_milestones(current_workflow)
    completed_milestones = []
    next_milestones = []
    
    for milestone in milestones:
        if is_milestone_complete(milestone, session_state):
            completed_milestones.append(milestone)
        else:
            next_milestones.append(milestone)
            break  # Next milestone only
    
    return {
        "completed": completed_milestones,
        "next": next_milestones[0] if next_milestones else None,
        "progress_percentage": len(completed_milestones) / len(milestones) * 100
    }
```

#### Progress Display
```markdown
## 📊 Workflow Progress

**Current Workflow**: {workflow_name}
**Progress**: {progress_percentage}% complete

### ✅ Completed Milestones
- {completed_milestone_1} ✓
- {completed_milestone_2} ✓

### 🎯 Next Milestone
**{next_milestone}** 
- **Persona**: {required_persona}
- **Tasks**: {required_tasks}
- **Expected Duration**: {estimated_time}
- **Dependencies**: {prerequisites}

### 📈 Efficiency Insights
Based on your patterns:
- You're {efficiency_comparison} compared to typical pace
- Consider: {optimization_suggestion}
```

### 6. Memory-Enhanced Decision Points

#### Critical Decision Detection
```python
def detect_critical_decisions(current_context):
    # Search for decisions typically made at this point
    typical_decisions = search_memory(
        f"decision point {current_context.phase} {current_context.project_type}",
        limit=5,
        threshold=0.7
    )
    
    pending_decisions = []
    for decision in typical_decisions:
        if not is_decision_made(decision, current_context):
            pending_decisions.append({
                "decision": decision.description,
                "urgency": assess_urgency(decision, current_context),
                "memory_guidance": decision.typical_outcomes,
                "recommended_approach": decision.successful_approaches
            })
    
    return pending_decisions
```

#### Decision Point Guidance
```markdown
## ⚠️ Critical Decision Points Ahead

### {Decision 1} (Urgency: {level})
**Decision**: {decision_description}
**Why it matters**: {impact_explanation}

**Memory Guidance**:
- **Typically decided by**: {typical_decision_maker}
- **Common approaches**: {approach_options}
- **Success factors**: {success_patterns}
- **Pitfalls to avoid**: {failure_patterns}

**Recommended**: {memory_based_recommendation}
```

### 7. Workflow Commands Integration

### Available Commands
```markdown
## 🛠️ Workflow Commands

### `/workflow` - Get current workflow guidance
- Analyzes current state and provides next step recommendations
- Includes memory-based insights and optimization suggestions
- Optional: Save output to `.ai/guidance/workflow/workflow-{date}.md`

### `/progress` - Show detailed progress tracking  
- Current workflow milestone status
- Efficiency analysis compared to typical patterns
- Upcoming decision points and requirements
- Optional: Save tracking to `.ai/guidance/workflow/progress-{date}.md`

### `/suggest` - Get intelligent next step suggestions
- Memory-enhanced recommendations based on similar situations
- Persona transition suggestions with confidence levels
- Optimization opportunities based on past patterns
- Optional: Save suggestions to `.ai/guidance/workflow/suggestions-{date}.md`

### `/template {workflow-name}` - Start specific workflow template
- Loads proven workflow templates from memory
- Customizes based on your historical preferences
- Sets up tracking and milestone monitoring
- Template saves to `.ai/guidance/workflow/template-{workflow-name}-{date}.md`

### `/optimize` - Analyze current workflow for improvements
- Compares current approach to successful memory patterns
- Identifies efficiency opportunities and bottlenecks
- Suggests process improvements based on past outcomes
- Optional: Save analysis to `.ai/guidance/workflow/optimization-{date}.md`
```

## Output Format Templates

### Standard Workflow Guidance Output
```markdown
# 🎯 Workflow Guidance

## Current Situation
**Project**: {project_name}
**Phase**: {current_phase}  
**Last Activity**: {last_persona} completed {last_task}

## Workflow Analysis
**Detected Pattern**: {workflow_type}
**Confidence**: {confidence_level}%
**Based on**: {number} similar projects in memory

## Immediate Recommendations
🚀 **Next Step**: {next_action}
🎭 **Recommended Persona**: {persona_name}
⏱️ **Estimated Time**: {time_estimate}

## Memory Insights
✅ **What typically works at this stage**:
- {insight_1}
- {insight_2}

⚠️ **Common pitfalls to avoid**:
- {pitfall_1}
- {pitfall_2}

## Quick Actions
- [ ] {actionable_item_1}
- [ ] {actionable_item_2}
- [ ] {actionable_item_3}

---
💡 **Need different guidance?** Try:
- `/progress` - See detailed progress tracking
- `/suggest` - Get alternative recommendations  
- `/template {name}` - Use a specific workflow template

**Storage**: This guidance can be saved to `.ai/guidance/workflow/workflow-guidance-{date}.md` for future reference.
```