# Dynamic Rule Engine

## Real-time Rule Generation and Management for Claude Code

The Dynamic Rule Engine enables Claude Code to create, adapt, and apply intelligent rules based on project context, learned patterns, and real-time development situations.

### Rule Architecture for Claude Code Integration

#### Rule Structure and Classification
```yaml
rule_definition:
  metadata:
    id: "{uuid}"
    name: "prevent_database_connection_leaks"
    category: "security|performance|quality|process|integration"
    created_by: "error_prevention_system"
    created_from: "pattern_analysis"
    created_timestamp: "2024-01-15T10:30:00Z"
    confidence_level: 87  # 0-100 confidence score
    usage_count: 15
    success_rate: 94.2
    
  conditions:
    when:
      - context_matches: "database_operations"
      - file_pattern: "**/*.{js,ts}"
      - technology_includes: ["nodejs", "postgresql", "mysql"]
      - operation_type: "code_modification"
      
    unless:
      - exception_condition: "test_files"
      - override_present: "disable_connection_check"
      - development_mode: true
      
  actions:
    must:
      - action: "validate_connection_cleanup"
        reason: "Prevent connection pool exhaustion"
        claude_tools: ["Grep", "Read"]
        validation_pattern: "connection.*close|pool.*release"
        
    should:
      - action: "suggest_connection_pool_monitoring"
        benefit: "Early detection of connection issues"
        claude_tools: ["Write", "Edit"]
        template: "connection_monitoring_template"
        
    must_not:
      - action: "create_connection_without_cleanup"
        consequence: "Potential connection pool exhaustion"
        detection_pattern: "new.*Connection(?!.*close)"
        
  validation:
    how_to_verify:
      - "Use Grep to find connection creation patterns"
      - "Verify each connection has corresponding cleanup"
      - "Check error handling paths for connection cleanup"
    automated_check: true
    success_criteria: "All connections have cleanup in same function or try/catch"
    claude_code_implementation: |
      async function validate_connection_cleanup(file_path) {
        const content = await claude_code_read(file_path);
        const connections = await claude_code_grep("new.*Connection", file_path);
        
        for (const connection of connections.matches) {
          const cleanup_check = await claude_code_grep(
            "close|release|end", 
            file_path,
            { context: 10, line_start: connection.line_number }
          );
          
          if (!cleanup_check.matches.length) {
            return {
              valid: false,
              issue: `Connection at line ${connection.line_number} lacks cleanup`,
              suggestion: "Add connection.close() or pool.release(connection)"
            };
          }
        }
        
        return { valid: true };
      }

  learning_context:
    source_incidents: ["connection_pool_exhaustion_incident_2024_01_10"]
    related_patterns: ["resource_management", "error_handling"]
    applicable_technologies: ["nodejs", "python", "java"]
    project_types: ["web_api", "microservices", "data_processing"]
    
  adaptation_rules:
    technology_adaptations:
      python:
        pattern_modifications:
          - original: "new.*Connection"
          - adapted: "connect\\(|Connection\\("
        cleanup_patterns:
          - "close()"
          - "disconnect()"
          - "with.*as.*conn:"
      java:
        pattern_modifications:
          - original: "new.*Connection"
          - adapted: "DriverManager\\.getConnection|DataSource\\.getConnection"
        cleanup_patterns:
          - "close()"
          - "try-with-resources"
```

### Dynamic Rule Generation

#### Pattern-Based Rule Creation
```python
async def generate_rules_from_patterns(pattern_analysis, project_context):
    """
    Generate intelligent rules from detected patterns using Claude Code insights
    """
    generated_rules = []
    
    for pattern in pattern_analysis.successful_patterns:
        # Analyze pattern for rule generation potential
        rule_potential = assess_rule_generation_potential(pattern)
        
        if rule_potential.score > 0.7:  # High potential for useful rule
            # Extract rule components from pattern
            rule_components = extract_rule_components(pattern, project_context)
            
            # Generate rule using Claude Code tools for validation
            generated_rule = await create_rule_from_pattern(
                rule_components,
                pattern,
                project_context
            )
            
            # Validate rule effectiveness
            validation_result = await validate_rule_effectiveness(
                generated_rule,
                project_context
            )
            
            if validation_result.is_effective:
                generated_rules.append(generated_rule)
    
    # Generate rules from error patterns
    for error_pattern in pattern_analysis.error_patterns:
        prevention_rule = await generate_prevention_rule(
            error_pattern,
            project_context
        )
        
        if prevention_rule:
            generated_rules.append(prevention_rule)
    
    return generated_rules

async def create_rule_from_pattern(rule_components, pattern, project_context):
    """
    Create a structured rule from pattern components
    """
    rule = {
        'id': generate_uuid(),
        'name': generate_rule_name(pattern),
        'category': classify_rule_category(pattern),
        'created_by': 'pattern_analysis',
        'created_from': pattern.source,
        'confidence_level': pattern.confidence_score,
        'metadata': {
            'pattern_id': pattern.id,
            'source_projects': pattern.source_projects,
            'success_rate': pattern.success_rate
        }
    }
    
    # Define conditions based on pattern context
    rule['conditions'] = {
        'when': [
            {'context_matches': pattern.context_type},
            {'technology_includes': pattern.applicable_technologies},
            {'file_pattern': pattern.file_patterns}
        ],
        'unless': extract_exception_conditions(pattern)
    }
    
    # Define actions based on pattern behavior
    if pattern.type == 'success_pattern':
        rule['actions'] = generate_success_pattern_actions(pattern, project_context)
    elif pattern.type == 'error_pattern':
        rule['actions'] = generate_error_prevention_actions(pattern, project_context)
    
    # Create validation strategy using Claude Code tools
    rule['validation'] = await create_validation_strategy(pattern, project_context)
    
    return rule

async def generate_success_pattern_actions(pattern, project_context):
    """
    Generate actions that encourage successful pattern adoption
    """
    actions = {
        'should': [],
        'could': [],
        'consider': []
    }
    
    # Analyze what made this pattern successful
    success_factors = analyze_pattern_success_factors(pattern)
    
    for factor in success_factors:
        if factor.impact_score > 0.8:  # High impact
            action = {
                'action': f"apply_{factor.name}",
                'benefit': factor.benefit_description,
                'claude_tools': determine_required_tools(factor),
                'implementation_guide': await generate_implementation_guide(
                    factor, 
                    project_context
                )
            }
            actions['should'].append(action)
            
        elif factor.impact_score > 0.5:  # Medium impact
            action = {
                'action': f"consider_{factor.name}",
                'benefit': factor.benefit_description,
                'claude_tools': determine_required_tools(factor),
                'when_appropriate': factor.applicable_contexts
            }
            actions['could'].append(action)
    
    return actions

async def generate_error_prevention_actions(pattern, project_context):
    """
    Generate actions that prevent error patterns
    """
    actions = {
        'must': [],
        'must_not': [],
        'validate': []
    }
    
    # Analyze error causes and prevention strategies
    error_analysis = analyze_error_pattern(pattern)
    
    for prevention_strategy in error_analysis.prevention_strategies:
        if prevention_strategy.criticality == 'high':
            # Create mandatory prevention action
            must_action = {
                'action': prevention_strategy.action_name,
                'reason': prevention_strategy.reasoning,
                'claude_tools': prevention_strategy.required_tools,
                'validation_pattern': prevention_strategy.validation_regex,
                'implementation': await generate_prevention_implementation(
                    prevention_strategy,
                    project_context
                )
            }
            actions['must'].append(must_action)
        
        # Create prohibition actions for dangerous patterns
        if prevention_strategy.prohibits:
            must_not_action = {
                'action': prevention_strategy.prohibited_action,
                'consequence': prevention_strategy.consequence_description,
                'detection_pattern': prevention_strategy.detection_regex,
                'alternative_approach': prevention_strategy.safer_alternative
            }
            actions['must_not'].append(must_not_action)
    
    return actions
```

#### Context-Aware Rule Application
```python
async def apply_rules_to_claude_operation(operation_type, operation_context, available_rules):
    """
    Apply relevant rules to Claude Code operations
    """
    # Filter rules relevant to current operation
    relevant_rules = filter_relevant_rules(
        available_rules,
        operation_type,
        operation_context
    )
    
    # Sort rules by priority and confidence
    prioritized_rules = prioritize_rules(relevant_rules, operation_context)
    
    rule_application_results = {
        'preventive_actions': [],
        'suggestions': [],
        'validations': [],
        'warnings': []
    }
    
    for rule in prioritized_rules:
        # Check rule conditions
        condition_check = await evaluate_rule_conditions(rule, operation_context)
        
        if condition_check.applies:
            # Apply rule actions
            application_result = await apply_rule_actions(
                rule,
                operation_context,
                condition_check
            )
            
            # Categorize results
            if rule['category'] in ['security', 'critical']:
                rule_application_results['preventive_actions'].extend(
                    application_result.preventive_actions
                )
            
            rule_application_results['suggestions'].extend(
                application_result.suggestions
            )
            
            rule_application_results['validations'].extend(
                application_result.validations
            )
            
            if application_result.warnings:
                rule_application_results['warnings'].extend(
                    application_result.warnings
                )
    
    return rule_application_results

async def apply_rule_actions(rule, operation_context, condition_check):
    """
    Apply specific rule actions using Claude Code tools
    """
    application_result = {
        'preventive_actions': [],
        'suggestions': [],
        'validations': [],
        'warnings': []
    }
    
    # Apply 'must' actions (mandatory)
    for must_action in rule['actions'].get('must', []):
        try:
            action_result = await execute_must_action(
                must_action,
                operation_context
            )
            application_result['preventive_actions'].append(action_result)
            
        except Exception as e:
            # Mandatory action failed - this is a warning
            application_result['warnings'].append({
                'rule_id': rule['id'],
                'action': must_action['action'],
                'error': str(e),
                'severity': 'high'
            })
    
    # Apply 'should' actions (recommendations)
    for should_action in rule['actions'].get('should', []):
        try:
            suggestion_result = await execute_should_action(
                should_action,
                operation_context
            )
            application_result['suggestions'].append(suggestion_result)
            
        except Exception as e:
            # Recommendation failed - log but continue
            application_result['warnings'].append({
                'rule_id': rule['id'],
                'action': should_action['action'],
                'error': str(e),
                'severity': 'low'
            })
    
    # Check 'must_not' actions (prohibitions)
    for must_not_action in rule['actions'].get('must_not', []):
        violation_check = await check_prohibition_violation(
            must_not_action,
            operation_context
        )
        
        if violation_check.is_violated:
            application_result['warnings'].append({
                'rule_id': rule['id'],
                'violation': must_not_action['action'],
                'consequence': must_not_action['consequence'],
                'severity': 'critical',
                'detection_details': violation_check.details
            })
    
    return application_result

async def execute_must_action(must_action, operation_context):
    """
    Execute mandatory rule action using appropriate Claude Code tools
    """
    action_type = must_action['action']
    required_tools = must_action.get('claude_tools', [])
    
    if action_type.startswith('validate_'):
        # Validation action
        validation_result = await execute_validation_action(
            must_action,
            operation_context,
            required_tools
        )
        return {
            'type': 'validation',
            'action': action_type,
            'result': validation_result,
            'passed': validation_result.get('valid', False)
        }
        
    elif action_type.startswith('ensure_'):
        # Enforcement action
        enforcement_result = await execute_enforcement_action(
            must_action,
            operation_context,
            required_tools
        )
        return {
            'type': 'enforcement',
            'action': action_type,
            'result': enforcement_result,
            'applied': enforcement_result.get('success', False)
        }
        
    elif action_type.startswith('prevent_'):
        # Prevention action
        prevention_result = await execute_prevention_action(
            must_action,
            operation_context,
            required_tools
        )
        return {
            'type': 'prevention',
            'action': action_type,
            'result': prevention_result,
            'prevented': prevention_result.get('blocked', False)
        }
    
    return {
        'type': 'unknown',
        'action': action_type,
        'result': {'error': 'Unknown action type'},
        'applied': False
    }
```

### Rule Learning and Evolution

#### Adaptive Rule Improvement
```python
async def learn_from_rule_applications():
    """
    Learn from rule application outcomes to improve rule effectiveness
    """
    # Get recent rule applications
    recent_applications = await get_recent_rule_applications(days=7)
    
    learning_insights = {
        'effective_rules': [],
        'ineffective_rules': [],
        'rule_improvements': [],
        'new_rule_opportunities': []
    }
    
    for application in recent_applications:
        # Analyze rule effectiveness
        effectiveness_analysis = analyze_rule_effectiveness(application)
        
        if effectiveness_analysis.was_helpful:
            learning_insights['effective_rules'].append({
                'rule_id': application.rule_id,
                'effectiveness_score': effectiveness_analysis.score,
                'positive_outcomes': effectiveness_analysis.positive_outcomes
            })
        else:
            learning_insights['ineffective_rules'].append({
                'rule_id': application.rule_id,
                'issues': effectiveness_analysis.issues,
                'improvement_suggestions': effectiveness_analysis.improvements
            })
    
    # Identify improvement opportunities
    for ineffective_rule in learning_insights['ineffective_rules']:
        rule_improvements = await generate_rule_improvements(
            ineffective_rule['rule_id'],
            ineffective_rule['issues'],
            ineffective_rule['improvement_suggestions']
        )
        learning_insights['rule_improvements'].append(rule_improvements)
    
    # Apply improvements
    for improvement in learning_insights['rule_improvements']:
        await apply_rule_improvement(improvement)
    
    return learning_insights

async def evolve_rule_based_on_feedback(rule_id, feedback_data):
    """
    Evolve a specific rule based on usage feedback and outcomes
    """
    # Load current rule
    current_rule = await load_rule(rule_id)
    
    # Analyze feedback patterns
    feedback_analysis = analyze_rule_feedback(feedback_data)
    
    evolution_changes = {
        'condition_refinements': [],
        'action_improvements': [],
        'confidence_adjustments': [],
        'scope_modifications': []
    }
    
    # Refine conditions based on false positives/negatives
    if feedback_analysis.false_positives > 0.1:  # 10% false positive rate
        condition_refinements = refine_rule_conditions(
            current_rule['conditions'],
            feedback_analysis.false_positive_cases
        )
        evolution_changes['condition_refinements'] = condition_refinements
    
    # Improve actions based on effectiveness feedback
    if feedback_analysis.action_effectiveness < 0.7:  # 70% effectiveness threshold
        action_improvements = improve_rule_actions(
            current_rule['actions'],
            feedback_analysis.action_feedback
        )
        evolution_changes['action_improvements'] = action_improvements
    
    # Adjust confidence based on success rate
    new_confidence = calculate_updated_confidence(
        current_rule['confidence_level'],
        feedback_analysis.success_rate,
        feedback_analysis.sample_size
    )
    evolution_changes['confidence_adjustments'] = new_confidence
    
    # Apply evolution changes
    evolved_rule = await apply_rule_evolution(current_rule, evolution_changes)
    
    # Store evolved rule
    await store_evolved_rule(evolved_rule)
    
    return {
        'rule_id': rule_id,
        'evolution_applied': True,
        'changes': evolution_changes,
        'new_confidence': new_confidence
    }
```

### Rule Repository Management

#### Intelligent Rule Organization
```yaml
rule_repository:
  categorization:
    by_domain:
      security_rules:
        - authentication_patterns
        - authorization_checks
        - input_validation
        - secure_communications
        
      performance_rules:
        - caching_strategies
        - database_optimization
        - resource_management
        - algorithm_efficiency
        
      quality_rules:
        - code_standards
        - testing_requirements
        - documentation_standards
        - maintainability_patterns
        
    by_technology:
      javascript_rules:
        - nodejs_specific
        - react_patterns
        - async_handling
        - package_management
        
      python_rules:
        - django_patterns
        - flask_patterns
        - data_processing
        - dependency_management
        
    by_project_phase:
      development_rules:
        - coding_standards
        - testing_practices
        - version_control
        
      deployment_rules:
        - configuration_management
        - environment_setup
        - monitoring_setup
        
  rule_lifecycle:
    creation:
      - pattern_analysis
      - manual_definition
      - error_learning
      - best_practice_codification
      
    evolution:
      - feedback_incorporation
      - effectiveness_optimization
      - scope_refinement
      - condition_improvement
      
    retirement:
      - obsolescence_detection
      - replacement_with_better_rules
      - context_no_longer_applicable
      - low_effectiveness_score
```

### Claude Code Integration Commands

```bash
# Rule generation and management
bmad rules generate --from-patterns --project-context "current"
bmad rules create --manual --category "security" --name "api_validation"
bmad rules import --from-project "path/to/project" --extract-patterns

# Rule application and validation
bmad rules apply --to-operation "file_edit" --file "src/auth.js"
bmad rules validate --rule-id "uuid" --test-context "nodejs_api"
bmad rules check --violations --severity "high"

# Rule learning and evolution
bmad rules learn --from-outcomes --time-period "last-week"
bmad rules evolve --rule-id "uuid" --based-on-feedback
bmad rules optimize --repository --remove-ineffective --merge-similar

# Rule analysis and reporting
bmad rules analyze --effectiveness --by-category
bmad rules report --usage-statistics --time-period "last-month"
bmad rules export --active-rules --format "yaml"
```

This Dynamic Rule Engine transforms Claude Code into an intelligent development assistant that can automatically create and apply context-appropriate rules, learn from experience, and continuously improve its guidance to prevent errors and promote best practices.