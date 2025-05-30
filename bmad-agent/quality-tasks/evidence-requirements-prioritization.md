# Evidence-Based Requirements Prioritization Task

## Purpose
Ensure all requirement prioritization decisions are backed by concrete evidence, validated data, and measurable impact projections. This task prevents opinion-based prioritization and enforces data-driven product decisions.

## Integration with Memory System
- **What patterns to search for**: Successful prioritization frameworks, feature adoption correlations, MVP scope patterns, value realization timelines
- **What outcomes to track**: Feature success rates, user adoption metrics, business value achievement, prioritization accuracy
- **What learnings to capture**: Effective evidence sources, prioritization framework evolution, stakeholder alignment strategies, value measurement approaches

## Evidence Categories for Prioritization

### User Evidence
```yaml
user_evidence:
  quantitative:
    - usage_analytics: Current behavior patterns
    - survey_data: User preference ratings
    - a_b_test_results: Feature validation data
    - support_tickets: Pain point frequency
  
  qualitative:
    - user_interviews: Direct feedback themes
    - usability_tests: Observed friction points
    - customer_reviews: Sentiment analysis
    - competitor_analysis: Feature gap identification
```

### Business Evidence
- [ ] **Revenue Impact**: Projected revenue increase/cost savings
- [ ] **Market Size**: TAM/SAM/SOM analysis
- [ ] **Strategic Alignment**: Company goal correlation
- [ ] **Competitive Advantage**: Differentiation potential
- [ ] **Cost-Benefit**: ROI calculations

### Technical Evidence
- [ ] **Feasibility Studies**: Development effort estimates
- [ ] **Technical Debt**: Impact on existing systems
- [ ] **Performance Impact**: System load projections
- [ ] **Security Implications**: Risk assessments
- [ ] **Maintenance Burden**: Long-term support costs

## Prioritization Framework

### Step 1: Evidence Collection Matrix
| Requirement | User Evidence | Business Evidence | Technical Evidence | Evidence Score |
|-------------|---------------|-------------------|-------------------|----------------|
| Feature A | Analytics: 80% need | Revenue: $500k/yr | Effort: 3 sprints | 85/100 |
| Feature B | Interviews: Critical | Market: 50k users | Complexity: High | 72/100 |
| Feature C | Support: 200 tickets/mo | Strategic: High | Risk: Low | 90/100 |

### Step 2: Impact vs Effort Analysis
```python
def calculate_priority_score(requirement):
    impact_score = weighted_average({
        'user_value': requirement.user_evidence_score * 0.4,
        'business_value': requirement.business_evidence_score * 0.4,
        'strategic_value': requirement.strategic_alignment * 0.2
    })
    
    effort_score = weighted_average({
        'development': requirement.dev_effort * 0.5,
        'maintenance': requirement.maintenance_cost * 0.3,
        'risk': requirement.technical_risk * 0.2
    })
    
    return impact_score / effort_score
```

### Step 3: Stakeholder Validation
```markdown
## Stakeholder Evidence Review
**Requirement**: {requirement_name}
**Priority Score**: {calculated_score}

### Evidence Presented
- **User Data**: {summary_of_user_evidence}
- **Business Case**: {summary_of_business_evidence}
- **Technical Assessment**: {summary_of_technical_evidence}

### Stakeholder Feedback
- **Product**: {agreement_level} - {feedback}
- **Engineering**: {agreement_level} - {feedback}
- **Sales**: {agreement_level} - {feedback}
- **Support**: {agreement_level} - {feedback}

### Final Priority**: {adjusted_priority}
```

## Quality Gates

### Evidence Collection Gate
- [ ] Minimum 3 evidence sources per requirement
- [ ] Quantitative data for top priority items
- [ ] User validation for all features
- [ ] Technical feasibility confirmed
- [ ] Business case documented

### Prioritization Gate
- [ ] All requirements scored objectively
- [ ] Trade-offs explicitly documented
- [ ] Dependencies mapped
- [ ] Resource constraints considered
- [ ] Timeline impacts assessed

### Validation Gate
- [ ] Stakeholder consensus achieved
- [ ] Success metrics defined
- [ ] Monitoring plan established
- [ ] Go/no-go criteria set
- [ ] Communication plan ready

## Evidence Quality Standards

### Acceptable Evidence Types
```python
evidence_standards = {
    "quantitative": {
        "minimum_sample_size": 100,
        "statistical_significance": 0.05,
        "data_freshness": "< 3 months"
    },
    "qualitative": {
        "minimum_interviews": 10,
        "persona_coverage": "all primary",
        "documentation": "verbatim quotes"
    },
    "business": {
        "financial_projections": "3 scenarios",
        "market_research": "primary sources",
        "competitive_analysis": "feature parity"
    }
}
```

## Success Criteria
- 100% of priorities backed by evidence
- Evidence quality score >80%
- Stakeholder alignment >90%
- Post-launch validation within 20% of projections
- Zero "gut feel" decisions

## Memory Integration
```python
# Prioritization decision memory
prioritization_memory = {
    "type": "requirements_prioritization",
    "context": {
        "product": product_name,
        "release": target_release,
        "constraints": resource_constraints
    },
    "requirements": {
        "evaluated": total_requirements,
        "prioritized": prioritized_list,
        "deferred": deprioritized_list
    },
    "evidence": {
        "sources": evidence_types_used,
        "quality": evidence_quality_scores,
        "gaps": identified_evidence_gaps
    },
    "outcomes": {
        "accuracy": projection_vs_actual,
        "value_delivered": measured_impact,
        "lessons": key_learnings
    },
    "confidence": overall_confidence
}
```

## Output Template
```markdown
# Evidence-Based Prioritization Report
**Product**: {product_name}
**Release**: {release_version}
**Date**: {timestamp}
**Confidence**: {percentage}%

## Prioritized Requirements

### Priority 1: Must Have
| Requirement | Impact Score | Effort | Evidence Summary | Success Metric |
|-------------|--------------|---------|-----------------|----------------|
| {req_name} | {score}/100 | {effort} | {evidence} | {metric} |

### Priority 2: Should Have
{similar_table}

### Priority 3: Nice to Have
{similar_table}

## Evidence Summary
- **User Research**: {participants} users, {methods} methods
- **Market Analysis**: {market_size}, {growth_rate}
- **Technical Assessment**: {feasibility_score}%, {risk_level}
- **Business Case**: {roi}%, {payback_period}

## Key Trade-offs
1. **{Decision}**: Chose {option_a} over {option_b} because {evidence}
2. **{Decision}**: Deferred {feature} due to {evidence}

## Risk Mitigation
{identified_risks_and_mitigation_strategies}

## Success Monitoring Plan
{how_we_will_validate_prioritization_decisions}
```

## Brotherhood Collaboration
- Evidence review with research team
- Technical validation with engineering
- Business case review with finance
- Market validation with sales/marketing 