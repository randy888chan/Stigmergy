# Story Quality Validation Task

## Purpose
Ensure all user stories meet comprehensive quality standards before development begins. This task validates story completeness, clarity, testability, and alignment with product goals to prevent rework and confusion during implementation.

## Integration with Memory System
- **What patterns to search for**: Common story defects, successful story formats, estimation accuracy patterns, acceptance criteria completeness
- **What outcomes to track**: Story rejection rates, clarification requests, implementation accuracy, delivery predictability
- **What learnings to capture**: Effective story formats, common missing elements, team-specific needs, domain-specific patterns

## Story Quality Dimensions

### Structure Quality
```yaml
story_structure:
  format: "As a [persona], I want [functionality], so that [value]"
  
  required_elements:
    - user_persona: Clearly defined target user
    - functionality: Specific feature/capability
    - business_value: Measurable benefit
    - acceptance_criteria: Testable conditions
    - dependencies: Related stories/systems
  
  optional_elements:
    - mockups: Visual representations
    - technical_notes: Implementation hints
    - analytics: Success metrics
```

### Content Quality Checklist
- [ ] **Single Responsibility**: Story focuses on one capability
- [ ] **User-Centric**: Written from user perspective
- [ ] **Independent**: Can be developed/tested alone
- [ ] **Negotiable**: Open to discussion, not prescriptive
- [ ] **Valuable**: Clear value to user/business
- [ ] **Estimable**: Team can estimate effort
- [ ] **Small**: Fits in one sprint
- [ ] **Testable**: Clear pass/fail criteria

## Validation Process

### Step 1: Structural Validation
```python
def validate_story_structure(story):
    validation_results = {
        "has_persona": check_persona_definition(story),
        "has_functionality": check_functionality_clarity(story),
        "has_value": check_value_statement(story),
        "has_acceptance_criteria": check_acceptance_criteria(story),
        "follows_invest": check_invest_criteria(story)
    }
    
    structure_score = calculate_structure_score(validation_results)
    return structure_score, validation_results
```

### Step 2: Acceptance Criteria Quality
```markdown
## Acceptance Criteria Validation
**Story**: {story_title}

### Criteria Quality Checks
- [ ] **Specific**: No ambiguous terms (e.g., "user-friendly")
- [ ] **Measurable**: Quantifiable outcomes defined
- [ ] **Achievable**: Technically feasible within constraints
- [ ] **Relevant**: Directly related to story value
- [ ] **Time-bound**: Clear completion definition

### Example Format
GIVEN {initial context}
WHEN {action taken}
THEN {expected outcome}
AND {additional outcomes}
```

### Step 3: Dependency Analysis
| Dependency Type | Description | Impact | Status |
|----------------|-------------|---------|---------|
| Technical | API dependency | Blocking | Resolved |
| Data | Migration required | High | In Progress |
| UX | Design approval | Medium | Pending |
| Business | Legal review | Low | Not Started |

## Quality Gates

### Story Creation Gate
- [ ] User persona validated against persona library
- [ ] Value statement quantified where possible
- [ ] Acceptance criteria cover happy path
- [ ] Edge cases identified
- [ ] Non-functional requirements noted

### Refinement Gate
- [ ] Team questions answered
- [ ] Estimates consensus reached
- [ ] Technical approach agreed
- [ ] Dependencies resolved or planned
- [ ] Success metrics defined

### Sprint Ready Gate
- [ ] All quality checks passed
- [ ] No blocking dependencies
- [ ] Test scenarios documented
- [ ] Design assets available
- [ ] Product owner approved

## Common Story Defects

### Anti-Patterns to Detect
```python
story_anti_patterns = {
    "technical_story": "As a developer, I want to refactor...",
    "vague_value": "...so that it works better",
    "missing_criteria": "No acceptance criteria defined",
    "too_large": "Story spans multiple epics",
    "solution_focused": "Implement using technology X",
    "unmeasurable": "Make the system faster"
}

def detect_anti_patterns(story):
    detected = []
    for pattern, description in story_anti_patterns.items():
        if matches_pattern(story, pattern):
            detected.append({
                "pattern": pattern,
                "severity": get_severity(pattern),
                "suggestion": get_improvement_suggestion(pattern)
            })
    return detected
```

## Success Criteria
- 100% stories have complete acceptance criteria
- Zero stories rejected during sprint for quality issues  
- Story clarification requests <10%
- Estimation accuracy within 20%
- Value delivery validation >90%

## Memory Integration
```python
# Story quality memory
story_quality_memory = {
    "type": "story_quality_validation",
    "story": {
        "id": story_id,
        "title": story_title,
        "sprint": target_sprint
    },
    "validation": {
        "structure_score": structural_validation_score,
        "content_score": content_quality_score,
        "criteria_score": acceptance_criteria_score,
        "overall_score": weighted_average
    },
    "issues": {
        "structural": structural_issues_found,
        "content": content_quality_issues,
        "dependencies": unresolved_dependencies,
        "risks": identified_risks
    },
    "improvements": {
        "applied": improvements_made,
        "suggested": remaining_suggestions
    },
    "outcomes": {
        "implementation_accuracy": actual_vs_expected,
        "clarifications_needed": clarification_count,
        "delivery_time": actual_vs_estimated
    }
}
```

## Story Quality Report Template
```markdown
# Story Quality Validation Report
**Story**: {story_id} - {story_title}
**Date**: {timestamp}
**Quality Score**: {score}/100

## Story Content
**As a** {persona}
**I want** {functionality}
**So that** {value}

## Acceptance Criteria Assessment
| Criterion | Quality | Issues | Suggestions |
|-----------|---------|---------|-------------|
| {criterion} | {score} | {issues} | {improvements} |

## Quality Dimensions
- **Structure**: {score}/100
- **Clarity**: {score}/100
- **Testability**: {score}/100
- **Value Definition**: {score}/100
- **Size**: {appropriate/too large/too small}

## Dependencies & Risks
### Dependencies
1. {dependency}: {status}

### Risks
1. {risk}: {mitigation}

## Validation Results
- [ ] INVEST criteria met
- [ ] Acceptance criteria complete
- [ ] Dependencies identified
- [ ] Team ready to estimate
- [ ] Product Owner approved

## Required Improvements
1. {improvement}: {action}

## Recommendation
{proceed/revise/split/defer} with confidence: {percentage}%
```

## Brotherhood Collaboration
- Story review with development team
- Acceptance criteria with QA team
- Value validation with product owner
- Dependency check with affected teams 