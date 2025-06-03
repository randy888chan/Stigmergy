# Brotherhood Review Task

## Purpose
Conduct honest, rigorous peer review to ensure quality and eliminate sycophantic behavior. Store review records at `.ai/quality/reviews/brotherhood-review-{date}.md`.

## Review Protocol

### Pre-Review Requirements
- [ ] Self-assessment completed honestly
- [ ] All quality gates passed
- [ ] UDTM documentation provided
- [ ] Real implementation verified (no mocks/stubs)

### Review Dimensions

#### 1. Technical Review
- [ ] **Code Quality**: Clean, maintainable, follows standards
- [ ] **Architecture**: Consistent with existing patterns
- [ ] **Performance**: Meets requirements, no obvious bottlenecks
- [ ] **Security**: No vulnerabilities, proper error handling

#### 2. Logic Review
- [ ] **Solution Appropriateness**: Best approach for the problem
- [ ] **Requirement Alignment**: Meets all specified requirements
- [ ] **Edge Case Handling**: Proper boundary condition management
- [ ] **Integration**: Works properly with existing systems

#### 3. Reality Check (CRITICAL)
- [ ] **Actually Works**: Functionality verified through testing
- [ ] **No Shortcuts**: Real implementation, not workarounds
- [ ] **Production Ready**: Would survive in production environment
- [ ] **Error Scenarios**: Handles failures gracefully

#### 4. Quality Standards
- [ ] **Zero Violations**: No Ruff or MyPy errors
- [ ] **Test Coverage**: Adequate and meaningful tests
- [ ] **Documentation**: Clear, accurate, complete
- [ ] **Maintainability**: Future developers can understand/modify

### Honest Assessment Questions
1. **Does this actually work as claimed?**
2. **Are there any shortcuts or workarounds?**
3. **Would this break in production?**
4. **Is this the best solution to the problem?**
5. **Am I being completely honest about the quality?**

### Review Process

#### Step 1: Independent Analysis (30 minutes)
- Review all artifacts without discussion
- Complete technical analysis independently
- Document initial findings and concerns
- Prepare specific questions and feedback

#### Step 2: Collaborative Discussion (15 minutes)
- Share findings openly and honestly
- Challenge assumptions and approaches
- Identify gaps and improvement opportunities
- Reach consensus on quality assessment

#### Step 3: Action Planning (15 minutes)
- Define specific improvement actions
- Assign ownership and timelines
- Establish re-review criteria if needed
- Document decisions and rationale

### Review Outcomes
- **APPROVE**: All criteria met, no issues identified
- **CONDITIONAL**: Minor fixes required, re-review needed within 24 hours
- **REJECT**: Major issues, return to planning/implementation phase

### Brotherhood Principles
- **Honesty First**: Truth over politeness
- **Quality Focus**: Excellence over speed
- **Mutual Support**: Help improve, don't just critique
- **Root Cause**: Address underlying issues, not symptoms
- **Continuous Improvement**: Learn from every review

## Anti-Sycophantic Enforcement

### Forbidden Responses
- "Looks good" without specific analysis
- "Great work" without identifying actual strengths
- "Minor issues" when major problems exist
- Agreement without independent verification

### Required Evidence
- Specific examples of quality or issues
- Reference to standards and best practices
- Demonstration of actual functionality testing
- Clear reasoning for all assessments

## Review Documentation

### Review Record Template
Save the review record at `.ai/quality/reviews/brotherhood-review-{date}.md`:

```markdown
## Brotherhood Review: [Task/Story Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: [Name]
**Reviewee**: [Name]

### Technical Assessment
- **Code Quality**: [Specific findings]
- **Architecture**: [Specific findings]
- **Performance**: [Specific findings]
- **Security**: [Specific findings]

### Reality Check Results
- **Functionality Test**: [Pass/Fail with evidence]
- **Production Readiness**: [Assessment with reasoning]
- **Error Handling**: [Specific scenarios tested]

### Honest Assessment
- **Strengths**: [Specific examples]
- **Weaknesses**: [Specific issues with impact]
- **Recommendations**: [Actionable improvements]

### Final Decision
- **Outcome**: [Approve/Conditional/Reject]
- **Confidence**: [1-10 with reasoning]
- **Next Steps**: [Specific actions required]
```

## Success Criteria
- Honest evaluation with documented findings
- Specific recommendations for improvement
- Confidence in production readiness
- Team knowledge sharing achieved
- Quality standards maintained or improved

## Integration with BMAD Workflow
- **Required for**: All story completion, architecture decisions, deployment
- **Frequency**: At minimum before story done, optionally mid-implementation
- **Documentation**: All reviews tracked in project quality metrics at `.ai/quality/reviews/`
- **Learning**: Review insights feed back into process improvement
- **Storage**: Each review record saved as `.ai/quality/reviews/brotherhood-review-{date}.md`