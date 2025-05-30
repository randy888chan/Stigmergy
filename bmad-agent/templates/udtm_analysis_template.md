# UDTM Analysis Template

## Task Overview
**Task**: [Brief Description of the Task/Problem]
**Date**: [YYYY-MM-DD]
**Analyst**: [Name/Role]
**Project**: [Project Name]
**Story/Epic**: [Reference ID]

## Phase 1: Multi-Angle Analysis

### Technical Perspective
**Correctness**: 
- [Analysis of technical accuracy and implementation correctness]
- [Verification against specifications and requirements]
- [Identification of potential technical errors or oversights]

**Performance**: 
- [Resource usage analysis (CPU, memory, network)]
- [Scalability considerations and bottlenecks]
- [Response time and throughput expectations]

**Maintainability**: 
- [Code readability and organization]
- [Modularity and extensibility]
- [Documentation and knowledge transfer requirements]

**Security**: 
- [Vulnerability assessment]
- [Data protection and privacy considerations]
- [Authentication and authorization requirements]

### Business Logic Perspective
**Requirement Alignment**: 
- [Mapping to business requirements and acceptance criteria]
- [Verification against user stories and use cases]
- [Identification of requirement gaps or misunderstandings]

**User Impact**: 
- [User experience considerations]
- [Accessibility and usability factors]
- [Impact on different user personas]

**Business Value**: 
- [ROI and value proposition analysis]
- [Alignment with business objectives]
- [Risk vs. benefit assessment]

### Integration Perspective
**System Compatibility**: 
- [Compatibility with existing systems and components]
- [Dependencies and coupling analysis]
- [Version compatibility and migration considerations]

**API Consistency**: 
- [API design consistency with existing patterns]
- [Contract compatibility and versioning]
- [Documentation and discoverability]

**Data Flow**: 
- [Data consistency and integrity]
- [Transaction boundaries and ACID properties]
- [Data transformation and validation requirements]

### Edge Case Perspective
**Boundary Conditions**: 
- [Input validation and boundary testing]
- [Limit conditions and overflow scenarios]
- [Empty data and null value handling]

**Error Scenarios**: 
- [Error handling and recovery mechanisms]
- [Graceful degradation strategies]
- [User feedback and error reporting]

**Resource Limits**: 
- [Memory and storage constraints]
- [Network and timeout limitations]
- [Concurrent user and load handling]

### Security Perspective
**Vulnerabilities**: 
- [Common security weakness analysis (OWASP Top 10)]
- [Input sanitization and validation]
- [SQL injection and XSS prevention]

**Attack Vectors**: 
- [Potential attack surfaces]
- [Authentication and session management]
- [Data exposure and information leakage]

### Performance Perspective
**Resource Usage**: 
- [CPU and memory utilization patterns]
- [I/O operations and disk usage]
- [Network bandwidth requirements]

**Scalability**: 
- [Horizontal and vertical scaling considerations]
- [Load distribution and balancing]
- [Caching and optimization strategies]

## Phase 2: Assumption Challenge

### Identified Assumptions
1. **Assumption**: [First identified assumption]
   - **Evidence For**: [Supporting evidence, facts, or documentation]
   - **Evidence Against**: [Contradicting evidence or alternative explanations]
   - **Risk Level**: [High/Medium/Low]
   - **Impact if Wrong**: [Consequences if assumption proves false]
   - **Verification Method**: [How to validate this assumption]

2. **Assumption**: [Second identified assumption]
   - **Evidence For**: [Supporting evidence, facts, or documentation]
   - **Evidence Against**: [Contradicting evidence or alternative explanations]
   - **Risk Level**: [High/Medium/Low]
   - **Impact if Wrong**: [Consequences if assumption proves false]
   - **Verification Method**: [How to validate this assumption]

3. **Assumption**: [Third identified assumption]
   - **Evidence For**: [Supporting evidence, facts, or documentation]
   - **Evidence Against**: [Contradicting evidence or alternative explanations]
   - **Risk Level**: [High/Medium/Low]
   - **Impact if Wrong**: [Consequences if assumption proves false]
   - **Verification Method**: [How to validate this assumption]

### Critical Dependencies
**Dependency 1**: [First critical dependency]
- **Nature**: [Technical/Business/Resource dependency]
- **Risk Assessment**: [Impact if dependency fails]
- **Mitigation Strategy**: [How to handle dependency failure]

**Dependency 2**: [Second critical dependency]
- **Nature**: [Technical/Business/Resource dependency]
- **Risk Assessment**: [Impact if dependency fails]
- **Mitigation Strategy**: [How to handle dependency failure]

### Assumption Validation Results
- [Summary of assumption validation efforts]
- [Assumptions confirmed vs. those requiring further investigation]
- [High-risk assumptions requiring immediate attention]

## Phase 3: Triple Verification

### Source 1: Documentation/Specifications
**Reference**: [Official documentation, specifications, or standards]
**Findings**: 
- [Key information discovered from this source]
- [Alignment with current understanding]
- [Any conflicts or gaps identified]
**Confidence**: [1-10 scale confidence in this source]
**Relevance**: [How directly this applies to current task]

### Source 2: Existing Codebase
**Reference**: [Relevant code files, patterns, or existing implementations]
**Findings**: 
- [Patterns and practices discovered in existing code]
- [Consistency requirements and constraints]
- [Lessons learned from existing implementations]
**Confidence**: [1-10 scale confidence in this source]
**Relevance**: [How directly this applies to current task]

### Source 3: External Validation
**Reference**: [External tools, testing, expert consultation, or research]
**Findings**: 
- [External validation results or expert opinions]
- [Tool-based analysis or automated verification]
- [Industry best practices or standards]
**Confidence**: [1-10 scale confidence in this source]
**Relevance**: [How directly this applies to current task]

### Cross-Reference Analysis
**Alignment**: [All sources agree / Partial agreement / Significant conflicts]
**Conflicts Identified**: 
- [Specific areas where sources disagree]
- [Impact of these conflicts on implementation approach]
- [Additional investigation required]

**Resolution Strategy**: 
- [How conflicts will be resolved]
- [Additional sources or validation needed]
- [Decision-making process for ambiguous areas]

## Phase 4: Weakness Hunting

### Potential Failure Points
1. **Failure Mode**: [First identified potential failure]
   - **Probability**: [High/Medium/Low - likelihood of occurrence]
   - **Impact**: [High/Medium/Low - severity if it occurs]
   - **Detection**: [How this failure would be discovered]
   - **Mitigation**: [Preventive measures and contingency plans]

2. **Failure Mode**: [Second identified potential failure]
   - **Probability**: [High/Medium/Low - likelihood of occurrence]
   - **Impact**: [High/Medium/Low - severity if it occurs]
   - **Detection**: [How this failure would be discovered]
   - **Mitigation**: [Preventive measures and contingency plans]

3. **Failure Mode**: [Third identified potential failure]
   - **Probability**: [High/Medium/Low - likelihood of occurrence]
   - **Impact**: [High/Medium/Low - severity if it occurs]
   - **Detection**: [How this failure would be discovered]
   - **Mitigation**: [Preventive measures and contingency plans]

### Edge Cases and Boundary Conditions
**Edge Case 1**: [First edge case scenario]
- **Scenario**: [Detailed description of the edge case]
- **Handling Strategy**: [How this will be addressed]
- **Testing Approach**: [How to verify proper handling]

**Edge Case 2**: [Second edge case scenario]
- **Scenario**: [Detailed description of the edge case]
- **Handling Strategy**: [How this will be addressed]
- **Testing Approach**: [How to verify proper handling]

### Integration Risks
**Integration Risk 1**: [First integration concern]
- **Risk Description**: [Detailed description of the integration risk]
- **Probability**: [Likelihood of this risk materializing]
- **Impact**: [Consequences if the risk occurs]
- **Mitigation**: [Steps to prevent or handle this risk]

**Integration Risk 2**: [Second integration concern]
- **Risk Description**: [Detailed description of the integration risk]
- **Probability**: [Likelihood of this risk materializing]
- **Impact**: [Consequences if the risk occurs]
- **Mitigation**: [Steps to prevent or handle this risk]

### What Could We Be Missing?
- [Systematic review of potential blind spots]
- [Areas where expertise might be lacking]
- [External factors that could impact the solution]
- [Hidden complexity or requirements]

## Phase 5: Final Reflection

### Complete Re-examination
**Initial Approach**: [Original approach and reasoning]
**Alternative Approaches Considered**: 
- [Alternative 1]: [Description and trade-offs]
- [Alternative 2]: [Description and trade-offs]
- [Alternative 3]: [Description and trade-offs]

**Final Recommendation**: [Chosen approach with justification]
- **Rationale**: [Why this approach is superior]
- **Trade-offs Accepted**: [What we're giving up for this choice]
- **Risk Acceptance**: [Risks we're willing to accept]

### Confidence Assessment
**Overall Confidence**: [1-10] (Must be >9.5 to proceed)
**Reasoning**: 
- [Detailed explanation of confidence level]
- [Factors contributing to confidence]
- [Factors detracting from confidence]

**Confidence Breakdown**:
- Technical Feasibility: [1-10]
- Requirements Understanding: [1-10]
- Risk Assessment: [1-10]
- Implementation Approach: [1-10]
- Integration Complexity: [1-10]

### Remaining Uncertainties
**Uncertainty 1**: [First remaining uncertainty]
- **Nature**: [What exactly is uncertain]
- **Impact**: [How this uncertainty affects the project]
- **Resolution Plan**: [How to address this uncertainty]
- **Timeline**: [When this needs to be resolved]

**Uncertainty 2**: [Second remaining uncertainty]
- **Nature**: [What exactly is uncertain]
- **Impact**: [How this uncertainty affects the project]
- **Resolution Plan**: [How to address this uncertainty]
- **Timeline**: [When this needs to be resolved]

### Quality Gate Confirmation
- [ ] **Technical Feasibility Confirmed**: Solution is technically achievable
- [ ] **Requirements Alignment Verified**: Solution meets all requirements
- [ ] **Risk Mitigation Planned**: All major risks have mitigation strategies
- [ ] **Integration Strategy Defined**: Clear plan for system integration
- [ ] **Testing Strategy Established**: Comprehensive testing approach defined
- [ ] **Success Criteria Clarified**: Clear definition of successful completion

## Final Decision and Next Steps

### Proceed Decision
**Proceed**: [ ] Yes / [ ] No / [ ] Conditional
**Reasoning**: 
- [Clear justification for the decision]
- [Key factors influencing the decision]
- [Any conditions that must be met]

### Implementation Strategy
**Approach**: [High-level implementation strategy]
**Phase 1**: [First phase activities and deliverables]
**Phase 2**: [Second phase activities and deliverables]
**Phase 3**: [Third phase activities and deliverables]

### Risk Monitoring
**Key Risks to Monitor**: 
- [Risk 1]: [Monitoring approach and triggers]
- [Risk 2]: [Monitoring approach and triggers]
- [Risk 3]: [Monitoring approach and triggers]

### Success Metrics
**Primary Metrics**: [How success will be measured]
**Secondary Metrics**: [Additional indicators of success]
**Monitoring Frequency**: [How often metrics will be reviewed]

### Next Immediate Actions
1. [First immediate action required]
2. [Second immediate action required]
3. [Third immediate action required]

---

## Analysis Sign-off

**Analyst**: [Name] - [Date]
**Reviewer**: [Name] - [Date]
**Approved**: [ ] Yes / [ ] No
**Final Confidence**: [1-10]
**Ready to Proceed**: [ ] Yes / [ ] No