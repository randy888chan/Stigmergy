# System Diagnostics Task

## Purpose
Comprehensive health check of BMAD installation, memory integration, and project structure to ensure optimal system performance and identify potential issues before they cause failures. Generate diagnostic reports at `.ai/quality/diagnostics/system-health-{timestamp}.md`.

## Diagnostic Procedures

### 1. Configuration Validation
```python
def validate_configuration():
    checks = []
    
    # Primary config file check
    config_path = "ide-bmad-orchestrator.cfg.md"
    checks.append({
        "name": "Primary Configuration File",
        "status": "PASS" if file_exists(config_path) else "FAIL",
        "details": f"Checking {config_path}",
        "recovery": "create_minimal_config()" if not file_exists(config_path) else None
    })
    
    # Config file parsing
    if file_exists(config_path):
        try:
            config_data = parse_config_file(config_path)
            checks.append({
                "name": "Configuration Parsing",
                "status": "PASS",
                "details": f"Successfully parsed with {len(config_data.agents)} agents defined"
            })
        except Exception as e:
            checks.append({
                "name": "Configuration Parsing", 
                "status": "FAIL",
                "details": f"Parse error: {str(e)}",
                "recovery": "repair_config_syntax()"
            })
    
    # Validate all referenced persona files
    persona_checks = validate_persona_files(config_data if 'config_data' in locals() else None)
    checks.extend(persona_checks)
    
    # Validate task file references
    task_checks = validate_task_files(config_data if 'config_data' in locals() else None)
    checks.extend(task_checks)
    
    return checks
```

#### Configuration Validation Results Format
```markdown
## 🔧 Configuration Validation

### ✅ Passing Checks
- **Primary Configuration File**: Found at ide-bmad-orchestrator.cfg.md
- **Configuration Parsing**: Successfully parsed with 8 agents defined
- **Persona Files**: 7/8 persona files found and accessible

### ⚠️ Warnings
- **Missing Persona**: `advanced-architect.md` referenced but not found
  - **Impact**: Advanced architecture features unavailable
  - **Recovery**: Download missing persona or use fallback
  
### ❌ Critical Issues
- **Task File Missing**: `create-advanced-prd.md` not found
  - **Impact**: Advanced PRD creation unavailable  
  - **Recovery**: Use standard PRD task or download missing file
```

### 2. Project Structure Check
```python
def validate_project_structure():
    structure_checks = []
    
    # Required directories
    required_dirs = [
        "bmad-agent",
        "bmad-agent/personas", 
        "bmad-agent/tasks",
        "bmad-agent/templates",
        "bmad-agent/checklists",
        "bmad-agent/data"
    ]
    
    for dir_path in required_dirs:
        exists = directory_exists(dir_path)
        structure_checks.append({
            "name": f"Directory: {dir_path}",
            "status": "PASS" if exists else "FAIL",
            "details": f"Required BMAD directory {'found' if exists else 'missing'}",
            "recovery": f"create_directory('{dir_path}')" if not exists else None
        })
    
    # Check for required files
    required_files = [
        "bmad-agent/data/bmad-kb.md",
        "bmad-agent/templates/prd-tmpl.md",
        "bmad-agent/templates/story-tmpl.md"
    ]
    
    for file_path in required_files:
        exists = file_exists(file_path)
        structure_checks.append({
            "name": f"File: {basename(file_path)}",
            "status": "PASS" if exists else "WARN",
            "details": f"Core file {'found' if exists else 'missing'}",
            "recovery": f"download_core_file('{file_path}')" if not exists else None
        })
    
    # Check file permissions
    permission_checks = validate_file_permissions()
    structure_checks.extend(permission_checks)
    
    return structure_checks
```

### 3. Memory System Validation
```python
def validate_memory_system():
    memory_checks = []
    
    # OpenMemory MCP connectivity
    try:
        # Test basic connection
        test_result = test_memory_connection()
        memory_checks.append({
            "name": "OpenMemory MCP Connection",
            "status": "PASS" if test_result.success else "FAIL",
            "details": f"Connection test: {test_result.message}",
            "recovery": "retry_memory_connection()" if not test_result.success else None
        })
        
        if test_result.success:
            # Test memory operations
            search_test = test_memory_search("test query")
            memory_checks.append({
                "name": "Memory Search Functionality",
                "status": "PASS" if search_test.success else "WARN", 
                "details": f"Search test: {search_test.response_time}ms",
                "recovery": "troubleshoot_memory_search()" if not search_test.success else None
            })
            
            # Test memory creation
            add_test = test_memory_creation()
            memory_checks.append({
                "name": "Memory Creation Functionality",
                "status": "PASS" if add_test.success else "WARN",
                "details": f"Creation test: {'successful' if add_test.success else 'failed'}",
                "recovery": "troubleshoot_memory_creation()" if not add_test.success else None
            })
            
            # Check memory index health
            index_health = check_memory_index_health()
            memory_checks.append({
                "name": "Memory Index Health",
                "status": "PASS" if index_health.healthy else "WARN",
                "details": f"Index contains {index_health.total_memories} memories",
                "recovery": "rebuild_memory_index()" if not index_health.healthy else None
            })
            
    except Exception as e:
        memory_checks.append({
            "name": "OpenMemory MCP Connection",
            "status": "FAIL",
            "details": f"Connection failed: {str(e)}",
            "recovery": "enable_fallback_mode()"
        })
    
    return memory_checks
```

### 4. Session State Validation
```python
def validate_session_state():
    session_checks = []
    
    # Check session state file location
    state_file = ".ai/orchestrator-state.md"
    
    if file_exists(state_file):
        # Validate state file format
        try:
            state_data = parse_session_state(state_file)
            session_checks.append({
                "name": "Session State File",
                "status": "PASS",
                "details": f"Valid state file with {len(state_data.decision_log)} decisions logged"
            })
            
            # Check state file writability
            write_test = test_session_state_write(state_file)
            session_checks.append({
                "name": "Session State Write Access",
                "status": "PASS" if write_test.success else "FAIL",
                "details": f"Write test: {'successful' if write_test.success else 'failed'}",
                "recovery": "fix_session_state_permissions()" if not write_test.success else None
            })
            
        except Exception as e:
            session_checks.append({
                "name": "Session State File",
                "status": "FAIL", 
                "details": f"Parse error: {str(e)}",
                "recovery": "backup_and_reset_session_state()"
            })
    else:
        session_checks.append({
            "name": "Session State File",
            "status": "INFO",
            "details": "No existing session state (will be created on first use)",
            "recovery": None
        })
    
    # Check backup directory
    backup_dir = ".ai/backups"
    session_checks.append({
        "name": "Session Backup Directory",
        "status": "PASS" if directory_exists(backup_dir) else "INFO",
        "details": f"Backup directory {'exists' if directory_exists(backup_dir) else 'will be created as needed'}",
        "recovery": f"create_directory('{backup_dir}')" if not directory_exists(backup_dir) else None
    })
    
    return session_checks
```

### 5. Resource Integrity Check
```python
def validate_resource_integrity():
    integrity_checks = []
    
    # Scan all persona files
    persona_files = glob("bmad-agent/personas/*.md")
    for persona_file in persona_files:
        try:
            persona_content = read_file(persona_file)
            validation_result = validate_persona_syntax(persona_content)
            
            integrity_checks.append({
                "name": f"Persona: {basename(persona_file)}",
                "status": "PASS" if validation_result.valid else "WARN",
                "details": f"Syntax validation: {'valid' if validation_result.valid else validation_result.issues}",
                "recovery": f"repair_persona_syntax('{persona_file}')" if not validation_result.valid else None
            })
            
        except Exception as e:
            integrity_checks.append({
                "name": f"Persona: {basename(persona_file)}",
                "status": "FAIL",
                "details": f"Read error: {str(e)}",
                "recovery": f"restore_persona_from_backup('{persona_file}')"
            })
    
    # Scan task files
    task_files = glob("bmad-agent/tasks/*.md")
    for task_file in task_files:
        try:
            task_content = read_file(task_file)
            task_validation = validate_task_syntax(task_content)
            
            integrity_checks.append({
                "name": f"Task: {basename(task_file)}",
                "status": "PASS" if task_validation.valid else "WARN",
                "details": f"Task structure: {'valid' if task_validation.valid else task_validation.issues}",
                "recovery": f"repair_task_syntax('{task_file}')" if not task_validation.valid else None
            })
            
        except Exception as e:
            integrity_checks.append({
                "name": f"Task: {basename(task_file)}",
                "status": "FAIL",
                "details": f"Read error: {str(e)}",
                "recovery": f"restore_task_from_backup('{task_file}')"
            })
    
    # Check template files
    template_files = glob("bmad-agent/templates/*.md")
    for template_file in template_files:
        try:
            template_content = read_file(template_file)
            template_validation = validate_template_completeness(template_content)
            
            integrity_checks.append({
                "name": f"Template: {basename(template_file)}",
                "status": "PASS" if template_validation.complete else "INFO",
                "details": f"Template completeness: {template_validation.completion_percentage}%",
                "recovery": f"update_template('{template_file}')" if template_validation.completion_percentage < 80 else None
            })
            
        except Exception as e:
            integrity_checks.append({
                "name": f"Template: {basename(template_file)}",
                "status": "FAIL",
                "details": f"Read error: {str(e)}",
                "recovery": f"restore_template_from_backup('{template_file}')"
            })
    
    return integrity_checks
```

### 6. Performance Health Check
```python
def validate_performance_health():
    performance_checks = []
    
    # Load time testing
    load_times = measure_component_load_times()
    for component, load_time in load_times.items():
        threshold = get_performance_threshold(component)
        status = "PASS" if load_time < threshold else "WARN"
        
        performance_checks.append({
            "name": f"Load Time: {component}",
            "status": status,
            "details": f"{load_time}ms (threshold: {threshold}ms)",
            "recovery": f"optimize_component_loading('{component}')" if status == "WARN" else None
        })
    
    # Memory usage check
    memory_usage = measure_memory_usage()
    memory_threshold = get_memory_threshold()
    memory_status = "PASS" if memory_usage < memory_threshold else "WARN"
    
    performance_checks.append({
        "name": "Memory Usage",
        "status": memory_status,
        "details": f"{memory_usage}MB (threshold: {memory_threshold}MB)",
        "recovery": "optimize_memory_usage()" if memory_status == "WARN" else None
    })
    
    # Cache performance
    cache_stats = get_cache_statistics()
    cache_hit_rate = cache_stats.hit_rate
    cache_status = "PASS" if cache_hit_rate > 70 else "WARN"
    
    performance_checks.append({
        "name": "Cache Performance",
        "status": cache_status,
        "details": f"Hit rate: {cache_hit_rate}% (target: >70%)",
        "recovery": "optimize_cache_strategy()" if cache_status == "WARN" else None
    })
    
    return performance_checks
```

## Comprehensive Diagnostic Report Generation

### Main Diagnostic Report
```python
def generate_diagnostic_report():
    # Run all diagnostic procedures
    config_results = validate_configuration()
    structure_results = validate_project_structure()
    memory_results = validate_memory_system()
    session_results = validate_session_state()
    integrity_results = validate_resource_integrity()
    performance_results = validate_performance_health()
    
    # Combine all results
    all_checks = {
        "Configuration": config_results,
        "Project Structure": structure_results,
        "Memory System": memory_results,
        "Session State": session_results,
        "Resource Integrity": integrity_results,
        "Performance": performance_results
    }
    
    # Analyze overall health
    health_analysis = analyze_overall_health(all_checks)
    
    # Generate recovery plan
    recovery_plan = generate_recovery_plan(all_checks)
    
    return {
        "health_status": health_analysis.overall_status,
        "detailed_results": all_checks,
        "summary": health_analysis.summary,
        "recovery_plan": recovery_plan,
        "recommendations": health_analysis.recommendations
    }
```

### Diagnostic Report Output Format
Save diagnostic reports at `.ai/quality/diagnostics/system-health-{timestamp}.md`:

```markdown
# 🔍 BMAD System Diagnostic Report
**Generated**: {timestamp}
**Project**: {project_path}
**Report Location**: .ai/quality/diagnostics/system-health-{timestamp}.md

## Overall Health Status: {HEALTHY|DEGRADED|CRITICAL}

### Executive Summary
{overall_health_summary}

## Detailed Results

### 🔧 Configuration ({pass_count}/{total_count} passing)
✅ **Passing**:
- {passing_check_1}
- {passing_check_2}

⚠️ **Warnings**:
- {warning_check_1}: {issue_description}
  - **Impact**: {impact_description}
  - **Resolution**: {recovery_action}

❌ **Critical Issues**:
- {critical_check_1}: {issue_description}
  - **Impact**: {impact_description}  
  - **Resolution**: {recovery_action}

### 📁 Project Structure ({pass_count}/{total_count} passing)
[Similar format for each diagnostic category]

### 🧠 Memory System ({pass_count}/{total_count} passing)
[Similar format]

### 💾 Session State ({pass_count}/{total_count} passing)
[Similar format]

### 📄 Resource Integrity ({pass_count}/{total_count} passing)
[Similar format]

### ⚡ Performance ({pass_count}/{total_count} passing)
[Similar format]

## Recovery Recommendations

### Immediate Actions (Critical)
1. **{Critical Issue 1}**
   - **Command**: `{recovery_command}`
   - **Expected Result**: {expected_outcome}
   - **Time Required**: ~{time_estimate}

### Suggested Improvements (Warnings)
1. **{Warning Issue 1}**
   - **Action**: {improvement_action}
   - **Benefit**: {improvement_benefit}
   - **Priority**: {priority_level}

### Optimization Opportunities
1. **{Optimization 1}**
   - **Description**: {optimization_description}
   - **Expected Benefit**: {performance_improvement}
   - **Implementation**: {implementation_steps}

## System Capabilities Status
✅ **Fully Functional**:
- {functional_capability_1}
- {functional_capability_2}

⚠️ **Degraded Functionality**:
- {degraded_capability_1}: {limitation_description}

❌ **Unavailable**:
- {unavailable_capability_1}: {reason_unavailable}

## Automated Recovery Available
{recovery_options}

## Next Steps
1. **Immediate**: {immediate_recommendation}
2. **Short-term**: {short_term_recommendation}  
3. **Long-term**: {long_term_recommendation}

## Report Storage
- **Location**: `.ai/quality/diagnostics/system-health-{timestamp}.md`
- **Historical Reports**: Previous diagnostics available in `.ai/quality/diagnostics/`
- **Metrics Tracking**: Diagnostic trends tracked in `.ai/quality/diagnostics/`

---
💡 **Quick Actions**:
- `/recover` - Attempt automatic recovery
- `/repair-config` - Fix configuration issues
- `/optimize` - Run performance optimizations
- `/help diagnostics` - Get detailed diagnostic help
```

## Automated Recovery Integration
```python
def execute_automated_recovery(diagnostic_results):
    recovery_actions = []
    
    for category, checks in diagnostic_results.detailed_results.items():
        for check in checks:
            if check.status == "FAIL" and check.recovery:
                try:
                    result = execute_recovery_action(check.recovery)
                    recovery_actions.append({
                        "action": check.recovery,
                        "success": result.success,
                        "details": result.message
                    })
                except Exception as e:
                    recovery_actions.append({
                        "action": check.recovery,
                        "success": False,
                        "details": f"Recovery failed: {str(e)}"
                    })
    
    return recovery_actions
```

## Output Deliverables
- **Primary Report**: Comprehensive diagnostic report saved at `.ai/quality/diagnostics/system-health-{timestamp}.md`
- **Recovery Log**: If recovery actions taken, log saved at `.ai/quality/diagnostics/recovery-{timestamp}.md`
- **Metrics Data**: Performance metrics and trends stored in `.ai/quality/diagnostics/`

This comprehensive diagnostic system provides deep insight into BMAD system health and offers automated recovery capabilities to maintain optimal performance.