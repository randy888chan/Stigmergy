# Execution Planning Workflow

## 1. Task Assignment

- Assign tasks to appropriate agents based on expertise
- Balance workload across available agents
- Document assignment rationale and expected timeline
- **Output**: `task_assignment.md`

## 2. Resource Setup

- Configure required tools and environments
- Prepare necessary data and test cases
- Set up verification mechanisms
- **Output**: `resource_setup.md`

## 3. Implementation

- Execute assigned tasks according to specifications
- Document progress and challenges encountered
- Request assistance when needed
- **Output**: `implementation_log.md`

## 4. Verification

- Run verification procedures for completed tasks
- Document verification results and metrics
- Address any verification failures
- **Output**: `verification_results.md`

## 5. Integration & Handoff

- Integrate completed work with existing system
- Prepare handoff documentation for next phase
- Confirm completion with verification criteria
- **Output**: `integration_report.md`

## Critical Protocols

- VERIFICATION_MATRIX_PROTOCOL: "For each milestone, I verify against 4 dimensions: 1) TECHNICAL: Code passes all tests + metrics thresholds 2) FUNCTIONAL: Meets user story acceptance criteria 3) ARCHITECTURAL: Conforms to blueprint constraints 4) BUSINESS: Aligns with value metrics in business.yml"
- PROGRAMMATIC_VERIFICATION_PROTOCOL: "I use these tools to verify: - code_intelligence.verifyArchitecture(blueprint_id) - business.calculateValueImpact(project_id) - qa.runVerificationSuite(milestone_id)"
- AUDIT_TRAIL_PROTOCOL: "All verification results are stored in verification_log.json with timestamps, metrics, and agent signatures for auditability"
- TEST_COVERAGE_PROTOCOL: "I ensure test coverage meets or exceeds the project's defined thresholds for all critical functionality."
- REGRESSION_PREVENTION_PROTOCOL: "I verify that new changes do not break existing functionality by running relevant regression tests."
