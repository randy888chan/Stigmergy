# Solution Repository

## Reusable Solution Pattern Storage for Claude Code

The Solution Repository provides Claude Code with a comprehensive library of proven solutions, enabling intelligent reuse and adaptation of successful approaches across projects.

### Solution Pattern Structure

#### Comprehensive Solution Schema
```yaml
solution_pattern:
  metadata:
    id: "{uuid}"
    name: "JWT Authentication Implementation"
    category: "security|architecture|performance|integration"
    tags: ["authentication", "jwt", "nodejs", "express", "security"]
    success_rate: 94.5  # Percentage successful implementations
    usage_count: 27     # Number of times applied
    created_date: "2024-01-15T10:30:00Z"
    last_updated: "2024-01-20T15:45:00Z"
    confidence_score: 0.92  # Reliability rating
    
  problem_context:
    description: "Implement stateless user authentication for REST API"
    problem_type: "authentication|authorization|data-access|performance"
    constraints: 
      - "Must be stateless for horizontal scaling"
      - "Need secure token storage on client"
      - "Require token refresh mechanism"
    requirements:
      - "User login/logout functionality"
      - "Protected route middleware"
      - "Token expiration handling"
    technology_stack: ["nodejs", "express", "jsonwebtoken", "bcrypt"]
    project_characteristics:
      size: "medium"  # small|medium|large|enterprise
      complexity: "moderate"  # simple|moderate|complex|expert
      team_size: "3-5"
      timeline: "2-3 weeks"
      
  solution_details:
    approach: "Token-based authentication with JWT"
    architecture_overview: |
      1. User credentials validation
      2. JWT token generation with payload
      3. Token transmission in HTTP headers
      4. Middleware-based route protection
      5. Token refresh mechanism
      
    implementation_steps:
      - step: 1
        description: "Set up JWT configuration and secrets"
        tools_used: ["Write", "Edit"]
        persona_responsible: "security"
        estimated_time: "30 minutes"
        code_files: ["config/jwt.js", ".env"]
        
      - step: 2
        description: "Implement user authentication endpoints"
        tools_used: ["Write", "Edit", "Read"]
        persona_responsible: "dev"
        estimated_time: "2 hours"
        code_files: ["routes/auth.js", "controllers/authController.js"]
        
      - step: 3
        description: "Create JWT middleware for route protection"
        tools_used: ["Write", "Read"]
        persona_responsible: "dev"
        estimated_time: "1 hour"
        code_files: ["middleware/auth.js"]
        
      - step: 4
        description: "Implement token refresh mechanism"
        tools_used: ["Write", "Edit"]
        persona_responsible: "dev"
        estimated_time: "1.5 hours"
        code_files: ["routes/auth.js", "utils/tokenUtils.js"]
        
    code_snippets:
      - language: "javascript"
        purpose: "JWT token generation"
        file_path: "utils/tokenUtils.js"
        code: |
          const jwt = require('jsonwebtoken');
          
          function generateToken(user) {
            const payload = {
              id: user.id,
              email: user.email,
              role: user.role
            };
            
            return jwt.sign(
              payload, 
              process.env.JWT_SECRET, 
              { expiresIn: '1h' }
            );
          }
          
          function generateRefreshToken(user) {
            return jwt.sign(
              { id: user.id }, 
              process.env.REFRESH_SECRET, 
              { expiresIn: '7d' }
            );
          }
          
      - language: "javascript"
        purpose: "Authentication middleware"
        file_path: "middleware/auth.js"
        code: |
          const jwt = require('jsonwebtoken');
          
          function authenticateToken(req, res, next) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            
            if (!token) {
              return res.status(401).json({ error: 'Access token required' });
            }
            
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
              if (err) {
                return res.status(403).json({ error: 'Invalid token' });
              }
              req.user = user;
              next();
            });
          }
          
    architecture_decisions:
      - decision: "Use JWT over session-based authentication"
        rationale: "Enables stateless architecture for better scalability"
        alternatives_considered: ["Session cookies", "OAuth2", "Basic auth"]
        trade_offs: "Tokens can't be revoked easily, but better for microservices"
        
      - decision: "Implement refresh token mechanism"
        rationale: "Balance security (short access tokens) with UX (avoid frequent logins)"
        alternatives_considered: ["Only access tokens", "Sliding sessions"]
        trade_offs: "Additional complexity but better security posture"
        
  validation:
    test_results:
      unit_tests: "95% coverage achieved"
      integration_tests: "All authentication flows tested"
      security_tests: "Token validation, expiration, refresh tested"
      load_tests: "1000 concurrent users handled successfully"
      
    performance_metrics:
      token_generation: "< 5ms average"
      token_validation: "< 2ms average"
      memory_usage: "Minimal impact on server memory"
      cpu_impact: "< 1% CPU overhead"
      
    user_feedback:
      developer_satisfaction: 4.7/5
      implementation_ease: 4.5/5
      documentation_quality: 4.8/5
      maintenance_effort: 4.6/5
      
  reusability:
    prerequisites:
      - "Node.js environment with Express.js"
      - "Database for user storage (any SQL/NoSQL)"
      - "Environment variables configuration"
      - "Basic understanding of JWT concepts"
      
    adaptation_guide: |
      To adapt this pattern:
      1. Adjust token payload based on user model
      2. Modify expiration times based on security requirements
      3. Customize middleware to handle different authentication levels
      4. Adapt refresh mechanism to specific logout requirements
      5. Configure CORS headers for frontend integration
      
    common_variations:
      - variation: "Role-based permissions"
        description: "Add role checking to middleware"
        additional_complexity: "Low"
        
      - variation: "Multi-tenant authentication"
        description: "Include tenant ID in token payload"
        additional_complexity: "Medium"
        
      - variation: "Social login integration"
        description: "Add OAuth providers (Google, GitHub, etc.)"
        additional_complexity: "High"
        
    compatibility_matrix:
      frontend_frameworks:
        - "React": "Direct integration with Axios interceptors"
        - "Vue.js": "Compatible with Vue Router guards"
        - "Angular": "Works with HTTP interceptors"
        - "Mobile": "Standard Bearer token approach"
      databases:
        - "MongoDB": "Direct user document storage"
        - "PostgreSQL": "Relational user table structure"
        - "MySQL": "Standard relational approach"
      deployment:
        - "Docker": "Environment variable configuration"
        - "Kubernetes": "Secret management integration"
        - "Serverless": "Stateless design ideal for functions"
```

### Solution Matching and Recommendation Engine

#### Intelligent Solution Discovery
```python
async def find_matching_solutions(problem_description, context):
    """
    Find solutions matching current problem using Claude Code tools
    """
    # Analyze problem characteristics using Read and Grep
    problem_analysis = await analyze_problem_context(problem_description, context)
    
    # Search solution repository
    search_criteria = {
        'technology_stack': context.get('tech_stack', []),
        'problem_type': problem_analysis.problem_type,
        'project_size': context.get('project_size', 'medium'),
        'constraints': problem_analysis.constraints,
        'requirements': problem_analysis.requirements
    }
    
    # Execute multi-dimensional search
    candidate_solutions = await search_solutions_by_criteria(search_criteria)
    
    # Calculate similarity scores
    scored_solutions = []
    for solution in candidate_solutions:
        similarity_score = calculate_solution_similarity(
            problem_analysis,
            solution['problem_context'],
            context
        )
        
        adaptation_complexity = assess_adaptation_complexity(
            solution,
            problem_analysis,
            context
        )
        
        confidence_score = calculate_confidence_score(
            solution['metadata']['success_rate'],
            solution['metadata']['usage_count'],
            similarity_score,
            adaptation_complexity
        )
        
        scored_solution = {
            **solution,
            'similarity_score': similarity_score,
            'adaptation_complexity': adaptation_complexity,
            'confidence_score': confidence_score,
            'estimated_effort': estimate_implementation_effort(
                solution, 
                adaptation_complexity
            )
        }
        
        scored_solutions.append(scored_solution)
    
    # Rank by overall fit
    ranked_solutions = sorted(
        scored_solutions, 
        key=lambda x: x['confidence_score'], 
        reverse=True
    )
    
    return ranked_solutions[:5]  # Return top 5 matches

async def adapt_solution_to_context(solution, target_context, claude_context):
    """
    Adapt a solution pattern to the specific target context
    """
    adaptation_plan = {
        'original_solution': solution,
        'target_context': target_context,
        'adaptations_needed': [],
        'adapted_implementation': {},
        'risk_assessment': {}
    }
    
    # Identify necessary adaptations
    adaptations = identify_required_adaptations(solution, target_context)
    
    for adaptation in adaptations:
        if adaptation.type == 'technology_substitution':
            # Adapt for different technology stack
            adapted_code = await adapt_code_for_technology(
                adaptation.original_code,
                adaptation.target_technology
            )
            adaptation_plan['adaptations_needed'].append({
                'type': 'technology',
                'description': f"Adapt from {adaptation.source_tech} to {adaptation.target_tech}",
                'complexity': adaptation.complexity,
                'adapted_code': adapted_code
            })
            
        elif adaptation.type == 'scale_adjustment':
            # Adapt for different project scale
            scaled_architecture = adapt_architecture_for_scale(
                solution['solution_details']['architecture_overview'],
                target_context['project_size']
            )
            adaptation_plan['adaptations_needed'].append({
                'type': 'scale',
                'description': f"Scale for {target_context['project_size']} project",
                'adapted_architecture': scaled_architecture
            })
            
        elif adaptation.type == 'constraint_accommodation':
            # Adapt for specific constraints
            constraint_accommodations = accommodate_constraints(
                solution,
                target_context['constraints']
            )
            adaptation_plan['adaptations_needed'].append({
                'type': 'constraints',
                'accommodations': constraint_accommodations
            })
    
    # Generate adapted implementation steps
    adaptation_plan['adapted_implementation'] = await generate_adapted_implementation(
        solution['solution_details']['implementation_steps'],
        adaptation_plan['adaptations_needed'],
        claude_context
    )
    
    # Assess risks of adaptation
    adaptation_plan['risk_assessment'] = assess_adaptation_risks(
        solution,
        adaptation_plan['adaptations_needed'],
        target_context
    )
    
    return adaptation_plan
```

#### Solution Application with Claude Code Integration
```python
async def apply_solution_with_claude_tools(solution, adaptation_plan, project_context):
    """
    Apply a solution pattern using Claude Code tools with guided implementation
    """
    application_session = {
        'session_id': generate_uuid(),
        'solution': solution,
        'adaptation_plan': adaptation_plan,
        'implementation_status': {},
        'validation_results': {},
        'rollback_checkpoints': []
    }
    
    # Create implementation workspace
    workspace_path = f"implementation/{application_session['session_id']}"
    await create_implementation_workspace(workspace_path)
    
    # Execute implementation steps
    for step in adaptation_plan['adapted_implementation']['steps']:
        # Create rollback checkpoint before each major step
        checkpoint = await create_rollback_checkpoint(step['id'])
        application_session['rollback_checkpoints'].append(checkpoint)
        
        try:
            # Execute step using appropriate Claude Code tools
            step_result = await execute_implementation_step(step, project_context)
            
            application_session['implementation_status'][step['id']] = {
                'status': 'completed',
                'result': step_result,
                'duration': step_result.get('duration'),
                'files_modified': step_result.get('files_modified', [])
            }
            
            # Validate step completion
            validation = await validate_step_completion(step, step_result, project_context)
            application_session['validation_results'][step['id']] = validation
            
            if not validation.passed:
                # Handle validation failure
                failure_response = await handle_step_validation_failure(
                    step,
                    validation,
                    application_session
                )
                
                if failure_response.action == 'rollback':
                    await rollback_to_checkpoint(checkpoint)
                    return {
                        'status': 'failed',
                        'failed_step': step['id'],
                        'reason': validation.failure_reason,
                        'rollback_completed': True
                    }
                elif failure_response.action == 'retry':
                    # Retry with modifications
                    step = failure_response.modified_step
                    continue
        
        except Exception as e:
            # Handle implementation error
            await rollback_to_checkpoint(checkpoint)
            return {
                'status': 'error',
                'failed_step': step['id'],
                'error': str(e),
                'rollback_completed': True
            }
    
    # Final validation of complete solution
    final_validation = await validate_complete_solution(
        solution,
        adaptation_plan,
        application_session,
        project_context
    )
    
    if final_validation.passed:
        # Document successful application
        await document_solution_application(
            solution,
            adaptation_plan,
            application_session,
            final_validation
        )
        
        # Update solution success metrics
        await update_solution_success_metrics(
            solution['metadata']['id'],
            final_validation.success_metrics
        )
        
        return {
            'status': 'success',
            'implementation_session': application_session,
            'validation': final_validation,
            'files_created': final_validation.files_created,
            'next_steps': final_validation.recommended_next_steps
        }
    else:
        return {
            'status': 'validation_failed',
            'issues': final_validation.issues,
            'partial_success': True,
            'completed_steps': len([s for s in application_session['implementation_status'].values() if s['status'] == 'completed'])
        }

async def execute_implementation_step(step, project_context):
    """
    Execute a single implementation step using appropriate Claude Code tools
    """
    step_start_time = datetime.utcnow()
    
    # Determine required tools based on step type
    required_tools = determine_required_tools(step)
    
    files_modified = []
    
    # Execute step actions
    for action in step['actions']:
        if action['type'] == 'create_file':
            # Use Write tool to create new files
            await claude_code_write(action['file_path'], action['content'])
            files_modified.append(action['file_path'])
            
        elif action['type'] == 'modify_file':
            # Use Edit or MultiEdit tool to modify existing files
            if len(action['modifications']) == 1:
                await claude_code_edit(
                    action['file_path'],
                    action['modifications'][0]['old_content'],
                    action['modifications'][0]['new_content']
                )
            else:
                await claude_code_multi_edit(
                    action['file_path'],
                    action['modifications']
                )
            files_modified.append(action['file_path'])
            
        elif action['type'] == 'run_command':
            # Use Bash tool to execute commands
            command_result = await claude_code_bash(action['command'])
            if command_result.return_code != 0:
                raise Exception(f"Command failed: {command_result.stderr}")
                
        elif action['type'] == 'validate_pattern':
            # Use Grep tool to validate patterns exist
            pattern_check = await claude_code_grep(action['pattern'])
            if not pattern_check.matches:
                raise Exception(f"Expected pattern not found: {action['pattern']}")
    
    step_duration = (datetime.utcnow() - step_start_time).total_seconds()
    
    return {
        'step_id': step['id'],
        'duration': step_duration,
        'files_modified': files_modified,
        'tools_used': required_tools,
        'success': True
    }
```

### Solution Quality Management

#### Continuous Solution Improvement
```python
async def update_solution_effectiveness(solution_id, application_outcome):
    """
    Update solution effectiveness based on application outcomes
    """
    # Load current solution
    solution = await load_solution(solution_id)
    
    # Analyze application outcome
    outcome_analysis = analyze_application_outcome(application_outcome)
    
    # Update success metrics
    if outcome_analysis.was_successful:
        solution['metadata']['usage_count'] += 1
        current_success_rate = solution['metadata']['success_rate']
        new_success_rate = (
            (current_success_rate * (solution['metadata']['usage_count'] - 1) + 100) / 
            solution['metadata']['usage_count']
        )
        solution['metadata']['success_rate'] = new_success_rate
        
        # Extract positive patterns
        positive_patterns = extract_positive_patterns(application_outcome)
        await integrate_positive_patterns(solution, positive_patterns)
        
    else:
        # Analyze failure and improve solution
        failure_analysis = analyze_failure_reasons(application_outcome)
        solution_improvements = generate_solution_improvements(
            solution,
            failure_analysis
        )
        
        # Update solution with improvements
        await apply_solution_improvements(solution, solution_improvements)
    
    # Update confidence score
    solution['metadata']['confidence_score'] = calculate_updated_confidence(
        solution['metadata']['success_rate'],
        solution['metadata']['usage_count'],
        outcome_analysis.quality_metrics
    )
    
    # Store updated solution
    await store_updated_solution(solution)
    
    return {
        'solution_updated': True,
        'new_success_rate': solution['metadata']['success_rate'],
        'new_confidence_score': solution['metadata']['confidence_score'],
        'improvements_made': outcome_analysis.was_successful == False
    }
```

### Claude Code Integration Commands

```bash
# Solution discovery and recommendation
bmad solutions search --problem "user-authentication" --tech-stack "nodejs,express"
bmad solutions recommend --context "microservices" --requirements "scalable,secure"
bmad solutions similar --to-solution "jwt-auth-pattern" --show-variations

# Solution application and adaptation
bmad solutions apply --solution "jwt-auth-pattern" --adapt-to-context
bmad solutions customize --solution-id "uuid" --for-project "current"
bmad solutions validate --applied-solution --against-requirements

# Solution management and learning
bmad solutions create --from-current-implementation --name "custom-caching-pattern"
bmad solutions update --solution-id "uuid" --based-on-outcome "successful"
bmad solutions analyze --effectiveness --time-period "last-3-months"

# Solution repository management
bmad solutions export --pattern-library --format "markdown"
bmad solutions import --from-project "path" --extract-patterns
bmad solutions optimize --repository --remove-obsolete --merge-similar
```

This Solution Repository transforms Claude Code into an intelligent development assistant that can instantly access and apply proven solutions while learning from each implementation to continuously improve its recommendations.