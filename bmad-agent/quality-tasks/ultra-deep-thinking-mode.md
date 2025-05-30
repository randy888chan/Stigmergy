# Ultra-Deep Thinking Mode (UDTM) Task

## Purpose
Execute rigorous, multi-angle analysis and verification protocol to ensure highest quality decision-making across all BMAD personas. This generic UDTM provides a comprehensive framework for deep analytical thinking.

## Integration with Memory System
- **What patterns to search for**: Similar analytical contexts, successful decision patterns, common pitfalls in similar analyses
- **What outcomes to track**: Decision quality metrics, time-to-insight, assumption validation accuracy
- **What learnings to capture**: Effective analysis patterns, common blind spots, successful verification strategies

## UDTM Protocol Adaptation
**Standard 90-minute protocol adaptable to persona-specific needs**

### Phase 1: Multi-Angle Analysis (35 minutes)
- [ ] **Primary Domain Perspective**: Core expertise area analysis
- [ ] **Cross-Domain Integration**: How this connects to other system aspects  
- [ ] **Stakeholder Impact**: Effects on all involved parties
- [ ] **System-Wide Implications**: Broader system effects
- [ ] **Risk and Opportunity**: Potential failures and optimization chances
- [ ] **Alternative Approaches**: Other viable solutions

### Phase 2: Assumption Challenge (15 minutes)
1. **List ALL assumptions** - explicit and implicit
2. **Systematic challenge** - attempt to disprove each
3. **Evidence gathering** - document proof for/against
4. **Dependency mapping** - identify assumption chains
5. **Confidence scoring** - rate each assumption's validity

### Phase 3: Triple Verification (25 minutes)
- [ ] **Primary Source**: Direct evidence from authoritative sources
- [ ] **Pattern Analysis**: Historical patterns and precedents
- [ ] **External Validation**: Independent verification methods
- [ ] **Cross-Reference**: Ensure all sources align
- [ ] **Confidence Assessment**: Overall verification strength

### Phase 4: Weakness Hunting (15 minutes)
- [ ] What are the blind spots in this analysis?
- [ ] What biases might be affecting judgment?
- [ ] What edge cases haven't been considered?
- [ ] What cascade failures could occur?
- [ ] What assumptions are most fragile?

## Quality Gates
### Pre-Analysis Gate
- [ ] Context fully understood
- [ ] All relevant information gathered
- [ ] Memory patterns reviewed
- [ ] Success criteria defined

### Analysis Quality Gate
- [ ] All perspectives thoroughly explored
- [ ] Assumptions explicitly documented
- [ ] Evidence comprehensively gathered
- [ ] Alternatives seriously considered

### Completion Gate
- [ ] Confidence level >95%
- [ ] All weaknesses addressed
- [ ] Verification completed
- [ ] Documentation comprehensive

## Success Criteria
- All protocol phases completed with documentation
- Multi-angle analysis covers minimum 6 perspectives
- Assumption validation rate >90%
- Triple verification achieved
- Weakness hunting yields actionable insights
- Overall confidence >95%

## Memory Integration
```python
# Pre-UDTM memory search
memory_queries = [
    f"UDTM analysis {current_context} successful patterns",
    f"common pitfalls {analysis_type} {domain}",
    f"assumption failures {similar_context}",
    f"verification strategies {problem_type}"
]

# Post-UDTM memory creation
analysis_memory = {
    "type": "udtm_analysis",
    "context": current_context,
    "perspectives_explored": perspectives_list,
    "assumptions_validated": validation_results,
    "weaknesses_identified": weakness_list,
    "outcome": analysis_outcome,
    "confidence": confidence_score,
    "reusable_insights": key_learnings
}
```

## Output Template
```markdown
# UDTM Analysis: {Topic}
**Date**: {timestamp}
**Analyst**: {persona}
**Confidence**: {percentage}%

## Multi-Angle Analysis
### Perspective 1: {Name}
{Detailed analysis}

### Perspective 2: {Name}
{Detailed analysis}

[Continue for all perspectives]

## Assumption Validation
| Assumption | Evidence For | Evidence Against | Confidence |
|------------|--------------|------------------|------------|
| {assumption} | {evidence} | {counter} | {score}% |

## Triple Verification Results
- **Primary Source**: {findings}
- **Pattern Analysis**: {findings}
- **External Validation**: {findings}

## Identified Weaknesses
1. {weakness}: {mitigation strategy}
2. {weakness}: {mitigation strategy}

## Final Recommendation
{Comprehensive recommendation with confidence level}
``` 