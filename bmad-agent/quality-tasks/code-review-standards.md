# Code Review Standards Task

## Purpose
Establish and enforce comprehensive code review standards to ensure code quality, knowledge sharing, and consistent development practices. This task defines the review process, criteria, and quality expectations for all code changes.

## Integration with Memory System
- **What patterns to search for**: Common review issues, effective feedback patterns, review time metrics, defect detection rates
- **What outcomes to track**: Review turnaround time, defects found vs missed, code quality improvements, team knowledge transfer
- **What learnings to capture**: Effective review techniques, common oversight areas, team-specific patterns, domain expertise gaps

## Code Review Categories

### Mandatory Review Areas
```yaml
review_checklist:
  functionality:
    - correctness: Logic produces expected results
    - edge_cases: Handles boundary conditions
    - error_handling: Graceful failure modes
    - performance: No obvious bottlenecks
  
  code_quality:
    - readability: Self-documenting code
    - maintainability: Easy to modify
    - consistency: Follows team standards
    - simplicity: No over-engineering
  
  security:
    - input_validation: Sanitizes user input
    - authentication: Proper access control
    - data_protection: Sensitive data handled
    - vulnerability_scan: No known vulnerabilities
```

### Review Depth Levels
- [ ] **Level 1 - Syntax**: Formatting, naming, basic standards
- [ ] **Level 2 - Logic**: Correctness, efficiency, edge cases
- [ ] **Level 3 - Design**: Architecture, patterns, abstractions
- [ ] **Level 4 - Context**: Business logic, domain accuracy
- [ ] **Level 5 - Future**: Maintainability, extensibility

## Review Process Standards

### Step 1: Pre-Review Automation
```python
def automated_pre_review():
    checks = {
        "syntax": run_linter(),
        "formatting": run_formatter_check(),
        "types": run_type_checker(),
        "tests": run_test_suite(),
        "coverage": check_coverage_delta(),
        "security": run_security_scan(),
        "complexity": analyze_complexity()
    }
    
    if not all_checks_pass(checks):
        return "Fix automated issues before human review"
    return "Ready for review"
```

### Step 2: Review Assignment
```python
reviewer_selection = {
    "primary_reviewer": {
        "criteria": "Domain expert or code owner",
        "sla": "4 hours for initial review"
    },
    "secondary_reviewer": {
        "criteria": "Different perspective/expertise",
        "sla": "8 hours for review",
        "required_for": "Critical paths, >500 LOC"
    }
}
```

### Step 3: Review Execution
| Review Aspect | Questions to Ask | Priority |
|---------------|------------------|-----------|
| Business Logic | Does this solve the right problem? | Critical |
| Code Design | Is this the simplest solution? | High |
| Performance | Will this scale with expected load? | High |
| Security | Are there any vulnerabilities? | Critical |
| Testing | Are all scenarios covered? | High |
| Documentation | Will others understand this? | Medium |

## Review Quality Standards

### Feedback Guidelines
```markdown
## Constructive Feedback Format

### Critical Issues (Must Fix)
🔴 **[Category]**: Issue description
**Location**: `file.js:42`
**Problem**: Specific issue explanation
**Suggestion**: How to fix it
**Example**: Code example if helpful

### Suggestions (Consider)
🟡 **[Category]**: Improvement opportunity
**Location**: `file.js:42`
**Current**: What exists now
**Better**: Suggested improvement
**Rationale**: Why this is better

### Positive Feedback (Good Work)
🟢 **[Category]**: What was done well
**Location**: `file.js:42`
**Highlight**: Specific good practice
**Impact**: Why this is valuable
```

### Review Metrics
```python
review_quality_metrics = {
    "thoroughness": {
        "lines_reviewed": actual_reviewed_lines,
        "comments_per_100_loc": comment_density,
        "issues_found": categorized_issues
    },
    "effectiveness": {
        "defects_caught": pre_production_catches,
        "defects_missed": production_escapes,
        "catch_rate": caught / (caught + missed)
    },
    "efficiency": {
        "review_time": time_to_complete,
        "rounds": review_iterations,
        "resolution_time": time_to_approval
    }
}
```

## Quality Gates

### Submission Gate
- [ ] PR description complete with context
- [ ] Automated checks passing
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Self-review completed

### Review Gate  
- [ ] All critical issues addressed
- [ ] Suggestions considered/responded
- [ ] No unresolved discussions
- [ ] Required approvals obtained
- [ ] Merge conflicts resolved

### Post-Review Gate
- [ ] CI/CD pipeline passes
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Deployment plan reviewed
- [ ] Rollback plan exists

## Anti-Patterns to Avoid

### Poor Review Behaviors
```python
review_anti_patterns = {
    "rubber_stamping": "LGTM without meaningful review",
    "nitpicking": "Focus only on style, miss logic issues",
    "design_at_review": "Major architecture changes in review",
    "personal_attacks": "Criticize developer not code",
    "delayed_response": "Let PRs sit for days",
    "unclear_feedback": "Vague comments without specifics"
}

def detect_poor_reviews(review):
    if review.time_spent < 60 and review.loc > 200:
        flag("Possible rubber stamping")
    if review.style_comments > review.logic_comments * 3:
        flag("Excessive nitpicking")
```

## Success Criteria
- Average review turnaround <4 hours
- Defect detection rate >80%
- Zero defects marked "should have caught in review"
- Team satisfaction with review process >85%
- Knowledge transfer evidence in reviews

## Memory Integration
```python
# Code review memory
code_review_memory = {
    "type": "code_review",
    "review": {
        "pr_id": pull_request_id,
        "reviewer": reviewer_id,
        "author": author_id,
        "size": lines_of_code
    },
    "quality": {
        "issues_found": {
            "critical": critical_count,
            "major": major_count,
            "minor": minor_count
        },
        "review_depth": depth_score,
        "feedback_quality": feedback_score
    },
    "patterns": {
        "common_issues": frequently_found_problems,
        "missed_issues": escaped_to_production,
        "effective_catches": prevented_incidents
    },
    "metrics": {
        "time_to_review": initial_response_time,
        "time_to_approve": total_review_time,
        "iterations": review_rounds
    },
    "learnings": {
        "knowledge_shared": concepts_explained,
        "patterns_identified": new_patterns_found,
        "improvements": process_improvements
    }
}
```

## Review Report Template
```markdown
# Code Review Summary
**PR**: #{pr_number} - {title}
**Author**: {author}
**Reviewers**: {reviewers}
**Review Time**: {duration}

## Changes Overview
- **Files Changed**: {count}
- **Lines Added**: +{additions}
- **Lines Removed**: -{deletions}
- **Test Coverage**: {coverage}%

## Review Findings
### Critical Issues: {count}
{list_of_critical_issues}

### Improvements: {count}
{list_of_suggestions}

### Commendations: {count}
{list_of_good_practices}

## Quality Assessment
- **Code Quality**: {score}/10
- **Test Quality**: {score}/10
- **Documentation**: {score}/10
- **Security**: {score}/10

## Review Effectiveness
- **Review Depth**: {comprehensive/adequate/surface}
- **Issues Found**: {count}
- **Time Investment**: {appropriate/rushed/excessive}

## Action Items
1. {required_change}: {owner}
2. {follow_up_item}: {owner}

## Approval Status
{approved/changes_requested/needs_discussion}
```

## Brotherhood Collaboration
- Pair review for complex changes
- Architecture review for design changes
- Security review for sensitive code
- Performance review for critical paths 