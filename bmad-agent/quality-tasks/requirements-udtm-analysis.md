# Requirements UDTM Analysis Task

## Purpose
Execute requirements-specific Ultra-Deep Thinking Mode analysis to ensure market-validated, user-centered, and evidence-based product requirements. This specialized UDTM focuses on comprehensive requirement validation and strategic product decision-making.

## Integration with Memory System
- **What patterns to search for**: Successful product features in similar markets, user behavior patterns, requirement prioritization outcomes, MVP scope decisions
- **What outcomes to track**: Feature adoption rates, user satisfaction metrics, requirement stability, business value realization
- **What learnings to capture**: Effective requirement elicitation techniques, prioritization strategies, user validation approaches, scope management patterns

## UDTM Protocol Adaptation for Requirements
**90-minute protocol for comprehensive requirements analysis**

### Phase 1: Multi-Perspective Requirements Analysis (35 min)
- [ ] **User Perspective**: User needs, pain points, jobs-to-be-done analysis
- [ ] **Business Perspective**: Revenue impact, strategic alignment, competitive advantage
- [ ] **Technical Perspective**: Feasibility, complexity, integration requirements
- [ ] **Market Perspective**: Competitive landscape, market trends, differentiation
- [ ] **Stakeholder Perspective**: Internal stakeholder needs, compliance, constraints
- [ ] **Future Perspective**: Scalability, extensibility, long-term vision alignment

### Phase 2: Requirements Assumption Challenge (15 min)
1. **User behavior assumptions**: How users will actually use features
2. **Market demand assumptions**: Size and urgency of market need
3. **Business model assumptions**: Revenue generation, cost implications
4. **Technical capability assumptions**: Development effort, maintenance burden
5. **Adoption assumptions**: User willingness to change, learning curve

### Phase 3: Triple Verification (25 min)
- [ ] **User Research**: Direct user feedback, behavioral data, usability testing
- [ ] **Market Analysis**: Competitor analysis, market research, industry trends
- [ ] **Technical Validation**: Feasibility studies, POC results, effort estimates
- [ ] **Business Case**: ROI analysis, cost-benefit, strategic fit
- [ ] **Cross-Reference**: All validation sources align and support requirements

### Phase 4: Requirements Weakness Hunting (15 min)
- [ ] Hidden complexity in user stories
- [ ] Unstated dependencies between requirements
- [ ] Scope creep vulnerabilities
- [ ] User adoption barriers
- [ ] Technical debt implications
- [ ] Market timing risks

## Quality Gates for Requirements

### Pre-Requirements Gate
- [ ] User research conducted with target personas
- [ ] Market analysis completed with competitive insights
- [ ] Business goals clearly defined and measurable
- [ ] Technical constraints identified and documented
- [ ] Stakeholder alignment achieved

### Requirements Definition Gate
- [ ] User stories follow consistent format with clear value
- [ ] Acceptance criteria are testable and specific
- [ ] Dependencies between requirements mapped
- [ ] Non-functional requirements explicitly defined
- [ ] Prioritization based on evidence and value

### Requirements Validation Gate
- [ ] User validation through prototypes or mockups
- [ ] Technical feasibility confirmed by development team
- [ ] Business value quantified and approved
- [ ] Risk assessment completed with mitigation strategies
- [ ] Scope boundaries clearly defined and agreed

## Success Criteria
- All requirements backed by user research evidence
- Business value quantified for each epic/feature
- Technical feasibility validated for all stories
- Market differentiation clearly articulated
- Stakeholder alignment documented
- Overall requirements confidence >95%

## Memory Integration
```python
# Requirements-specific memory queries
req_memory_queries = [
    f"product requirements {market_segment} {user_persona} success patterns",
    f"feature prioritization {product_type} {mvp_scope} outcomes",
    f"user validation {validation_method} {feature_type} effectiveness",
    f"requirement changes {project_phase} {change_frequency} impact",
    f"scope creep {project_type} prevention strategies"
]

# Requirements decision memory
requirements_memory = {
    "type": "requirements_decision",
    "product_context": {
        "market": market_segment,
        "personas": target_personas,
        "problem": problem_statement
    },
    "requirements": {
        "epics": epic_definitions,
        "prioritization": priority_rationale,
        "validation": user_validation_results
    },
    "evidence": {
        "user_research": research_findings,
        "market_analysis": competitive_insights,
        "business_case": roi_analysis
    },
    "risks": identified_risks,
    "confidence": confidence_score,
    "success_metrics": defined_kpis
}
```

## Requirements Analysis Output Template
```markdown
# Requirements UDTM Analysis: {Product/Feature Name}
**Date**: {timestamp}
**Product Manager**: {name}
**Market Segment**: {segment}
**Confidence**: {percentage}%

## Multi-Perspective Analysis

### User Needs Analysis
- **Primary Need**: {core_problem}
- **User Evidence**: {research_data}
- **Priority Ranking**: {prioritization}

### Market Validation
- **Market Size**: {tam_sam_som}
- **Competitive Gap**: {differentiation}
- **Timing**: {market_readiness}

### Business Case
- **Revenue Potential**: {projections}
- **Cost Analysis**: {development_operational}
- **ROI Timeline**: {break_even}

## Requirements Validation Summary
| Requirement | User Evidence | Market Validation | Technical Feasibility | Business Value | Risk |
|-------------|---------------|-------------------|---------------------|----------------|------|
| {req_name} | {evidence} | {validation} | {feasibility} | {value} | {risk} |

## Scope Definition
### MVP Scope
- **Core Features**: {essential_features}
- **Success Metrics**: {kpis}
- **Out of Scope**: {deferred_features}

### Post-MVP Roadmap
- **Phase 1**: {next_features}
- **Phase 2**: {future_vision}

## Risk Analysis
1. **{Risk}**: {description}
   - Likelihood: {high/medium/low}
   - Impact: {high/medium/low}
   - Mitigation: {strategy}

## Recommendations
{Detailed requirements recommendations with confidence levels and evidence}
```

## Brotherhood Collaboration Protocol
- User validation sessions with UX team
- Technical feasibility review with development team
- Business case review with stakeholders
- Market validation with sales/marketing teams 