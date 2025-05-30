# Error Recovery Procedures

## Purpose
Comprehensive error detection, graceful degradation, and self-recovery mechanisms for the memory-enhanced BMAD system.

## Common Error Scenarios & Resolutions

### 1. Configuration Errors

#### **Error**: `ide-bmad-orchestrator.cfg.md` not found
- **Detection**: Startup initialization failure
- **Recovery Steps**:
  1. Search for config file in parent directories (up to 3 levels)
  2. Check for alternative config file names (`config.md`, `orchestrator.cfg`)
  3. Create minimal config from built-in template
  4. Prompt user for project root confirmation
  5. Offer to download standard BMAD structure

**Recovery Implementation**:
```python
def recover_missing_config():
    search_paths = [
        "./ide-bmad-orchestrator.cfg.md",
        "../ide-bmad-orchestrator.cfg.md", 
        "../../ide-bmad-orchestrator.cfg.md",
        "./bmad-agent/ide-bmad-orchestrator.cfg.md"
    ]
    
    for path in search_paths:
        if file_exists(path):
            return load_config(path)
    
    # Create minimal fallback config
    return create_minimal_config()
```

#### **Error**: Persona file referenced but missing
- **Detection**: Persona activation failure  
- **Recovery Steps**:
  1. List available persona files in personas directory
  2. Suggest closest match by name similarity (fuzzy matching)
  3. Offer generic fallback persona with reduced functionality
  4. Provide download link for missing personas
  5. Log missing persona for later resolution

**Fallback Persona Selection**:
```python
def find_fallback_persona(missing_persona_name):
    available_personas = list_available_personas()
    
    # Fuzzy match by name similarity
    best_match = find_closest_match(missing_persona_name, available_personas)
    
    if similarity_score(missing_persona_name, best_match) > 0.7:
        return best_match
    
    # Use generic fallback based on persona type
    persona_type = extract_persona_type(missing_persona_name)
    return get_generic_fallback(persona_type)
```

### 2. Project Structure Errors

#### **Error**: `bmad-agent/` directory missing
- **Detection**: Path resolution failure during initialization
- **Recovery Steps**:
  1. Search for BMAD structure in parent directories (recursive search)
  2. Check for partial BMAD installation (some directories present)
  3. Offer to initialize BMAD structure in current directory
  4. Provide setup wizard for new installations
  5. Download missing components automatically

**Structure Recovery**:
```python
def recover_bmad_structure():
    # Search for existing BMAD components
    search_result = recursive_search_bmad_structure()
    
    if search_result.found:
        return use_existing_structure(search_result.path)
    
    if search_result.partial:
        return complete_partial_installation(search_result.missing_components)
    
    # No BMAD structure found - offer to create
    return offer_structure_creation()
```

#### **Error**: Task or template file missing during execution
- **Detection**: Task execution attempt with missing file
- **Recovery Steps**:
  1. Check for alternative task files with similar names
  2. Search for task file in backup locations
  3. Provide generic task template with reduced functionality
  4. Continue with reduced functionality, log limitation clearly
  5. Offer to download missing task files

**Missing File Fallback**:
```python
def handle_missing_task_file(missing_file):
    # Try alternative names/locations
    alternatives = find_alternative_task_files(missing_file)
    
    if alternatives:
        return use_alternative_task(alternatives[0])
    
    # Use generic fallback
    generic_task = create_generic_task_template(missing_file)
    log_limitation(f"Using generic fallback for {missing_file}")
    
    return generic_task
```

### 3. Memory System Errors

#### **Error**: OpenMemory MCP connection failure
- **Detection**: Memory search/add operations failing
- **Recovery Steps**:
  1. Attempt reconnection with exponential backoff
  2. Fall back to file-based context persistence
  3. Queue memory operations for later sync
  4. Notify user of reduced functionality
  5. Continue with session-only context

**Memory Fallback System**:
```python
def handle_memory_system_failure():
    # Try reconnection
    if attempt_memory_reconnection():
        return "reconnected"
    
    # Fall back to file-based context
    enable_file_based_context_fallback()
    
    # Queue pending operations
    queue_memory_operations_for_retry()
    
    # Notify user
    notify_user_of_memory_degradation()
    
    return "fallback_mode"
```

#### **Error**: Memory search returning no results unexpectedly
- **Detection**: Empty results for queries that should return data
- **Recovery Steps**:
  1. Verify memory connection and authentication
  2. Try alternative search queries with broader terms
  3. Check memory index integrity
  4. Fall back to session-only context
  5. Rebuild memory index if necessary

### 4. Session State Errors

#### **Error**: Corrupted session state file
- **Detection**: JSON/YAML parsing failure during state loading
- **Recovery Steps**:
  1. Create backup of corrupted file with timestamp
  2. Attempt partial recovery using regex parsing
  3. Initialize fresh session state with available information
  4. Attempt to recover key information from backup
  5. Notify user of reset and potential information loss

**Session State Recovery**:
```python
def recover_corrupted_session_state(corrupted_file):
    # Backup corrupted file
    backup_file = create_backup(corrupted_file)
    
    # Attempt partial recovery
    recovered_data = attempt_partial_recovery(corrupted_file)
    
    if recovered_data.success:
        return create_session_from_partial_data(recovered_data)
    
    # Create fresh session with basic info
    return create_fresh_session_with_backup_reference(backup_file)
```

#### **Error**: Session state write permission denied
- **Detection**: File system error during state saving
- **Recovery Steps**:
  1. Check file permissions and ownership
  2. Try alternative session state location
  3. Use memory-only session state temporarily
  4. Prompt user for permission fix
  5. Disable session persistence if unfixable

### 5. Resource Loading Errors

#### **Error**: Template or checklist file corrupted
- **Detection**: File parsing failure during task execution
- **Recovery Steps**:
  1. Use fallback generic template for the same purpose
  2. Check for template file in backup locations
  3. Download fresh template from repository
  4. Log specific error for user investigation
  5. Continue with warning about reduced functionality

**Template Recovery**:
```python
def recover_corrupted_template(template_name):
    # Try fallback templates
    fallback = get_fallback_template(template_name)
    
    if fallback:
        log_warning(f"Using fallback template for {template_name}")
        return fallback
    
    # Create minimal template
    minimal_template = create_minimal_template(template_name)
    log_limitation(f"Using minimal template for {template_name}")
    
    return minimal_template
```

#### **Error**: Persona file load timeout
- **Detection**: File loading exceeds timeout threshold
- **Recovery Steps**:
  1. Retry with extended timeout
  2. Check file size and complexity
  3. Use cached version if available
  4. Load persona in chunks if possible
  5. Fall back to simplified persona version

### 6. Consultation System Errors

#### **Error**: Multi-persona consultation initialization failure
- **Detection**: Failed to load multiple personas simultaneously
- **Recovery Steps**:
  1. Identify which specific personas failed to load
  2. Continue consultation with available personas
  3. Use fallback personas for missing ones
  4. Adjust consultation protocol for reduced participants
  5. Notify user of consultation limitations

**Consultation Recovery**:
```python
def recover_consultation_failure(requested_personas, failure_details):
    successful_personas = []
    fallback_personas = []
    
    for persona in requested_personas:
        if persona in failure_details.failed_personas:
            fallback = get_consultation_fallback(persona)
            if fallback:
                fallback_personas.append(fallback)
        else:
            successful_personas.append(persona)
    
    # Adjust consultation for available personas
    return adjust_consultation_protocol(successful_personas + fallback_personas)
```

## Error Reporting & Communication

### User-Friendly Error Messages
```python
def generate_user_friendly_error(error_type, technical_details):
    error_templates = {
        "config_missing": {
            "message": "BMAD configuration not found. Let me help you set up.",
            "actions": ["Create new config", "Search for existing config", "Download BMAD"],
            "severity": "warning"
        },
        "persona_missing": {
            "message": "The requested specialist isn't available. I can suggest alternatives.",
            "actions": ["Use similar specialist", "Download missing specialist", "Continue with generic"],
            "severity": "info"
        },
        "memory_failure": {
            "message": "Memory system temporarily unavailable. Using session-only context.",
            "actions": ["Retry connection", "Continue without memory", "Check system status"],
            "severity": "warning"
        }
    }
    
    template = error_templates.get(error_type, get_generic_error_template())
    return format_error_message(template, technical_details)
```

### Error Recovery Guidance
```markdown
# 🔧 System Recovery Guidance

## Issue Detected: {error_type}
**Severity**: {severity_level}
**Impact**: {functionality_impact}

## What Happened
{user_friendly_explanation}

## Recovery Actions Available
1. **{Primary Action}** (Recommended)
   - What it does: {action_description}
   - Expected outcome: {expected_result}
   
2. **{Alternative Action}**
   - What it does: {action_description}
   - When to use: {usage_scenario}

## Current System Status
✅ **Working**: {functional_components}
⚠️ **Limited**: {degraded_components}
❌ **Unavailable**: {failed_components}

## Next Steps
Choose an action above, or:
- `/diagnose` - Run comprehensive system health check
- `/recover` - Attempt automatic recovery
- `/fallback` - Switch to safe mode with basic functionality

Would you like me to attempt automatic recovery?
```

## Recovery Success Tracking

### Recovery Effectiveness Monitoring
```python
def track_recovery_effectiveness(error_type, recovery_action, outcome):
    recovery_memory = {
        "type": "error_recovery",
        "error_type": error_type,
        "recovery_action": recovery_action,
        "outcome": outcome,
        "success": outcome.success,
        "time_to_recovery": outcome.duration,
        "user_satisfaction": outcome.user_rating,
        "system_stability_after": assess_stability_post_recovery(),
        "lessons_learned": extract_recovery_lessons(outcome)
    }
    
    # Store in memory for learning
    add_memories(
        content=json.dumps(recovery_memory),
        tags=["error-recovery", error_type, recovery_action],
        metadata={"type": "recovery", "success": outcome.success}
    )
```

### Adaptive Recovery Learning
```python
def learn_from_recovery_patterns():
    recovery_memories = search_memory(
        "error_recovery outcome success failure",
        limit=50,
        threshold=0.5
    )
    
    patterns = analyze_recovery_patterns(recovery_memories)
    
    # Update recovery strategies based on success patterns
    for pattern in patterns.successful_approaches:
        update_recovery_strategy(pattern.error_type, pattern.approach)
    
    # Flag ineffective recovery approaches
    for pattern in patterns.failed_approaches:
        deprecate_recovery_strategy(pattern.error_type, pattern.approach)
```

## Proactive Error Prevention

### Health Monitoring
```python
def continuous_health_monitoring():
    health_checks = [
        check_config_file_integrity(),
        check_persona_file_availability(),
        check_memory_system_connectivity(),
        check_session_state_writability(),
        check_disk_space_availability(),
        check_file_permissions()
    ]
    
    for check in health_checks:
        if check.status == "warning":
            schedule_preemptive_action(check)
        elif check.status == "critical":
            trigger_immediate_recovery(check)
```

### Predictive Error Detection
```python
def predict_potential_errors(current_system_state):
    # Use memory patterns to predict likely failures
    similar_states = search_memory(
        f"system state {current_system_state.key_indicators}",
        limit=10,
        threshold=0.7
    )
    
    potential_errors = []
    for state in similar_states:
        if state.led_to_errors:
            potential_errors.append({
                "error_type": state.error_type,
                "probability": calculate_error_probability(state, current_system_state),
                "prevention_action": state.prevention_strategy,
                "early_warning_signs": state.warning_indicators
            })
    
    return rank_error_predictions(potential_errors)
```

This comprehensive error recovery system ensures that the BMAD orchestrator can gracefully handle failures while maintaining functionality and learning from each recovery experience.