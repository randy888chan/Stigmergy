# Anti-Pattern Detection Task

## Purpose
Systematically identify and eliminate anti-patterns that compromise quality and reliability.

## Detection Categories

### Code Anti-Patterns
- [ ] **Mock Services**: MockService, DummyService, FakeService
- [ ] **Placeholder Code**: TODO, FIXME, NotImplemented, pass
- [ ] **Assumption Language**: "probably", "I think", "maybe", "should work"
- [ ] **Shortcuts**: "quick fix", "temporary", "workaround", "hack"

### Implementation Anti-Patterns
- [ ] **Dummy Data**: Hardcoded test values in production paths
- [ ] **Generic Exceptions**: Catch-all exception handling
- [ ] **Copy-Paste**: Duplicated code without abstraction
- [ ] **Magic Numbers**: Unexplained constants

### Process Anti-Patterns
- [ ] **Skip Planning**: Direct implementation without design
- [ ] **Ignore Linting**: Proceeding with unresolved violations
- [ ] **Mock Testing**: Tests that don't verify real functionality
- [ ] **Assumption Implementation**: Building on unverified assumptions

### Communication Anti-Patterns
- [ ] **Sycophantic Approval**: "Looks good" without analysis
- [ ] **Vague Feedback**: Non-specific criticism or praise
- [ ] **False Confidence**: Claiming certainty without verification
- [ ] **Scope Creep**: Adding unrequested features

## Detection Process

### Automated Scanning

#### Code Pattern Regex
```regex
# Critical Anti-Patterns (Immediate Failure)
TODO|FIXME|HACK|XXX
MockService|DummyService|FakeService
NotImplemented|NotImplementedError
pass\s*$

# Warning Patterns (Review Required)
probably|maybe|I think|should work
quick fix|temporary|workaround
magic number|hardcoded

# Communication Patterns
looks good|great work(?!\s+because)
minor issues(?!\s+specifically)
```

#### File Scanning Script
```python
import re
from pathlib import Path

CRITICAL_PATTERNS = [
    r'TODO|FIXME|HACK|XXX',
    r'MockService|DummyService|FakeService',
    r'NotImplemented|NotImplementedError',
    r'pass\s*$'
]

WARNING_PATTERNS = [
    r'probably|maybe|I think|should work',
    r'quick fix|temporary|workaround',
    r'magic number|hardcoded'
]

def scan_file(file_path):
    violations = []
    with open(file_path, 'r') as f:
        content = f.read()
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            for pattern in CRITICAL_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append({
                        'file': file_path,
                        'line': i,
                        'pattern': pattern,
                        'severity': 'CRITICAL',
                        'content': line.strip()
                    })
    
    return violations
```

### Manual Review Process

#### 1. Code Review Checklist
- [ ] **Logic Patterns**: Are solutions based on solid reasoning?
- [ ] **Error Handling**: Specific exceptions vs generic catches?
- [ ] **Test Quality**: Do tests verify real functionality?
- [ ] **Documentation**: Accurate and complete?

#### 2. Communication Review
- [ ] **Specificity**: Feedback includes concrete examples?
- [ ] **Evidence**: Claims backed by verifiable facts?
- [ ] **Honesty**: Assessment reflects actual quality?
- [ ] **Completeness**: All aspects properly evaluated?

#### 3. Process Review
- [ ] **Planning**: Proper design before implementation?
- [ ] **Standards**: Code quality tools used and violations addressed?
- [ ] **Testing**: Integration with real systems verified?
- [ ] **Documentation**: Architecture and decisions recorded?

## Violation Response Protocol

### Immediate Actions
1. **STOP WORK**: Halt current task until pattern resolved
2. **ISOLATE ISSUE**: Identify scope and impact of violation
3. **ROOT CAUSE ANALYSIS**: Why did this pattern emerge?
4. **PROPER SOLUTION**: Implement correct approach
5. **VERIFICATION**: Confirm pattern fully eliminated

### Documentation Requirements
```markdown
## Anti-Pattern Violation Report
**Date**: [YYYY-MM-DD]
**Detector**: [Name/Tool]
**Pattern Type**: [Category]

### Violation Details
- **Pattern**: [Specific pattern found]
- **Location**: [File, line, function]
- **Severity**: [Critical/Warning]
- **Context**: [Why this occurred]

### Root Cause Analysis
- **Primary Cause**: [Technical/Process/Knowledge gap]
- **Contributing Factors**: [List all factors]
- **Prevention Strategy**: [How to avoid in future]

### Resolution
- **Action Taken**: [Specific fix implemented]
- **Verification**: [How fix was confirmed]
- **Timeline**: [Time to resolve]
- **Learning**: [Key insights gained]
```

## Pattern Categories Deep Dive

### Critical Patterns (Zero Tolerance)
- **Mock Services in Production**: Any service that doesn't perform real work
- **Placeholder Code**: Any code that admits incompleteness
- **Assumption Code**: Logic based on unverified assumptions
- **Generic Errors**: Exception handling that obscures real issues

### Warning Patterns (Review Required)
- **Uncertainty Language**: Expressions of doubt in technical communication
- **Shortcut Indicators**: Language suggesting temporary or suboptimal solutions
- **Copy-Paste Code**: Duplicated logic without proper abstraction
- **Magic Values**: Unexplained constants or configuration

### Process Patterns (Workflow Violations)
- **Skip Planning**: Implementation without proper design phase
- **Ignore Quality**: Proceeding despite linting or test failures
- **Insufficient Testing**: Tests that don't verify real functionality
- **Poor Documentation**: Missing or inaccurate technical documentation

## Success Criteria
- Zero critical anti-patterns detected
- All warning patterns reviewed and justified
- Process violations addressed with corrective actions
- Pattern prevention measures implemented
- Team education completed on detected patterns

## Integration Points
- **Pre-Commit Hooks**: Automated scanning before code commits
- **CI/CD Pipeline**: Pattern detection in automated builds
- **Code Reviews**: Manual pattern detection as part of review process
- **Sprint Reviews**: Pattern trends analyzed and addressed
- **Retrospectives**: Process patterns examined for root causes

## Metrics and Reporting
- **Pattern Frequency**: Track occurrence by type and team member
- **Resolution Time**: Average time to fix different pattern types
- **Trend Analysis**: Pattern emergence patterns over time
- **Education Effectiveness**: Reduction in patterns after training
- **Quality Correlation**: Relationship between patterns and defects