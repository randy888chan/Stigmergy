#!/usr/bin/env python3
"""
BMAD Orchestrator State Validation Script

Validates .ai/orchestrator-state.md against the YAML schema definition.
Provides detailed error reporting and validation summaries.

Usage:
    python .ai/validate-orchestrator-state.py [--file PATH] [--fix-common]
"""

import sys
import yaml
import json
import argparse
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

try:
    import jsonschema
    from jsonschema import validate, ValidationError, Draft7Validator
except ImportError:
    print("ERROR: jsonschema library not found.")
    print("Install with: pip install jsonschema")
    sys.exit(1)

@dataclass
class ValidationResult:
    """Represents the result of a validation operation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
    validation_time: float
    file_size: int

class OrchestratorStateValidator:
    """Main validator for orchestrator state files."""
    
    def __init__(self, schema_path: str = ".ai/orchestrator-state-schema.yml"):
        self.schema_path = Path(schema_path)
        self.schema = self._load_schema()
        self.validator = Draft7Validator(self.schema)
        
    def _load_schema(self) -> Dict[str, Any]:
        """Load the YAML schema definition."""
        try:
            with open(self.schema_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Schema file not found: {self.schema_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML schema: {e}")
    
    def extract_yaml_from_markdown(self, content: str) -> Dict[str, Any]:
        """Extract YAML data from orchestrator state markdown file."""
        # Look for YAML frontmatter or code blocks
        yaml_patterns = [
            r'```yaml\n(.*?)\n```',  # YAML code blocks
            r'```yml\n(.*?)\n```',   # YML code blocks  
            r'---\n(.*?)\n---',      # YAML frontmatter
        ]
        
        for pattern in yaml_patterns:
            matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
            if matches:
                try:
                    yaml_content = matches[0]
                    # Handle case where YAML doesn't end with closing backticks
                    if '```' in yaml_content:
                        yaml_content = yaml_content.split('```')[0]
                    
                    return yaml.safe_load(yaml_content)
                except yaml.YAMLError as e:
                    continue
        
        # Try a simpler approach: find the start and end of the YAML block
        yaml_start = content.find('```yaml\n')
        if yaml_start != -1:
            yaml_start += 8  # Skip "```yaml\n"
            yaml_end = content.find('\n```', yaml_start)
            if yaml_end != -1:
                yaml_content = content[yaml_start:yaml_end]
                try:
                    return yaml.safe_load(yaml_content)
                except yaml.YAMLError as e:
                    pass
        
        # If no YAML blocks found, try to parse the entire content as YAML
        try:
            return yaml.safe_load(content)
        except yaml.YAMLError as e:
            raise ValueError(f"No valid YAML found in file. Error: {e}")
    
    def validate_file(self, file_path: str) -> ValidationResult:
        """Validate an orchestrator state file."""
        start_time = datetime.now()
        file_path = Path(file_path)
        
        if not file_path.exists():
            return ValidationResult(
                is_valid=False,
                errors=[f"File not found: {file_path}"],
                warnings=[],
                suggestions=["Create the orchestrator state file"],
                validation_time=0.0,
                file_size=0
            )
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                file_size = len(content.encode('utf-8'))
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"Failed to read file: {e}"],
                warnings=[],
                suggestions=[],
                validation_time=0.0,
                file_size=0
            )
        
        # Extract YAML data
        try:
            data = self.extract_yaml_from_markdown(content)
        except ValueError as e:
            return ValidationResult(
                is_valid=False,
                errors=[str(e)],
                warnings=[],
                suggestions=[
                    "Ensure the file contains valid YAML in code blocks or frontmatter",
                    "Check YAML syntax and indentation"
                ],
                validation_time=(datetime.now() - start_time).total_seconds(),
                file_size=file_size
            )
        
        # Validate against schema
        errors = []
        warnings = []
        suggestions = []
        
        try:
            validate(data, self.schema)
            is_valid = True
        except ValidationError as e:
            is_valid = False
            errors.append(self._format_validation_error(e))
            suggestions.extend(self._get_error_suggestions(e))
        
        # Additional validation checks
        additional_errors, additional_warnings, additional_suggestions = self._perform_additional_checks(data)
        errors.extend(additional_errors)
        warnings.extend(additional_warnings)
        suggestions.extend(additional_suggestions)
        
        validation_time = (datetime.now() - start_time).total_seconds()
        
        return ValidationResult(
            is_valid=is_valid and not additional_errors,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            validation_time=validation_time,
            file_size=file_size
        )
    
    def _format_validation_error(self, error: ValidationError) -> str:
        """Format a validation error for human readability."""
        path = " -> ".join(str(p) for p in error.absolute_path) if error.absolute_path else "root"
        return f"At '{path}': {error.message}"
    
    def _get_error_suggestions(self, error: ValidationError) -> List[str]:
        """Provide suggestions based on validation error type."""
        suggestions = []
        
        if "required" in error.message.lower():
            suggestions.append(f"Add the required field: {error.message.split()[-1]}")
        elif "enum" in error.message.lower():
            suggestions.append("Check allowed values in the schema")
        elif "format" in error.message.lower():
            if "date-time" in error.message:
                suggestions.append("Use ISO-8601 format: YYYY-MM-DDTHH:MM:SSZ")
            elif "uuid" in error.message.lower():
                suggestions.append("Use UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx")
        elif "minimum" in error.message.lower() or "maximum" in error.message.lower():
            suggestions.append("Check numeric value ranges in the schema")
        
        return suggestions
    
    def _perform_additional_checks(self, data: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
        """Perform additional validation beyond schema checks."""
        errors = []
        warnings = []
        suggestions = []
        
        # Check timestamp consistency
        if 'session_metadata' in data:
            metadata = data['session_metadata']
            if 'created_timestamp' in metadata and 'last_updated' in metadata:
                try:
                    created = datetime.fromisoformat(metadata['created_timestamp'].replace('Z', '+00:00'))
                    updated = datetime.fromisoformat(metadata['last_updated'].replace('Z', '+00:00'))
                    if updated < created:
                        errors.append("last_updated cannot be earlier than created_timestamp")
                except ValueError:
                        warnings.append("Invalid timestamp format detected")
        
        # Check memory system coherence
        if 'memory_intelligence_state' in data:
            memory_state = data['memory_intelligence_state']
            if memory_state.get('memory_status') == 'connected' and memory_state.get('memory_provider') == 'unavailable':
                warnings.append("Memory status is 'connected' but provider is 'unavailable'")
            
            # Check if memory sync is recent
            if 'last_memory_sync' in memory_state:
                try:
                    sync_time = datetime.fromisoformat(memory_state['last_memory_sync'].replace('Z', '+00:00'))
                    if (datetime.now().replace(tzinfo=sync_time.tzinfo) - sync_time).total_seconds() > 3600:
                        warnings.append("Memory sync is older than 1 hour")
                except ValueError:
                    warnings.append("Invalid memory sync timestamp")
        
        # Check quality framework consistency
        if 'quality_framework_integration' in data:
            quality = data['quality_framework_integration']
            if 'quality_status' in quality:
                status = quality['quality_status']
                if status.get('quality_gates_active') is False and status.get('current_gate') != 'none':
                    warnings.append("Quality gates are inactive but current_gate is not 'none'")
        
        # Check workflow context consistency
        if 'active_workflow_context' in data:
            workflow = data['active_workflow_context']
            if 'current_state' in workflow and 'epic_context' in workflow:
                current_phase = workflow['current_state'].get('current_phase')
                epic_status = workflow['epic_context'].get('epic_status')
                
                if current_phase == 'development' and epic_status == 'planning':
                    warnings.append("Development phase but epic is still in planning")
        
        # Performance suggestions
        if 'system_health_monitoring' in data:
            health = data['system_health_monitoring']
            if 'performance_metrics' in health:
                metrics = health['performance_metrics']
                if metrics.get('average_response_time', 0) > 2000:
                    suggestions.append("Consider performance optimization - response time > 2s")
                if metrics.get('memory_usage', 0) > 80:
                    suggestions.append("High memory usage detected - consider cleanup")
                if metrics.get('error_frequency', 0) > 10:
                    suggestions.append("High error frequency - investigate system issues")
        
        return errors, warnings, suggestions
    
    def fix_common_issues(self, file_path: str) -> bool:
        """Attempt to fix common validation issues."""
        file_path = Path(file_path)
        if not file_path.exists():
            return False
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract and fix YAML data
            data = self.extract_yaml_from_markdown(content)
            
            # Fix common issues
            fixed = False
            
            # Ensure required session metadata
            if 'session_metadata' not in data:
                data['session_metadata'] = {}
                fixed = True
            
            metadata = data['session_metadata']
            current_time = datetime.now().isoformat() + 'Z'
            
            if 'session_id' not in metadata:
                import uuid
                metadata['session_id'] = str(uuid.uuid4())
                fixed = True
            
            if 'created_timestamp' not in metadata:
                metadata['created_timestamp'] = current_time
                fixed = True
            
            if 'last_updated' not in metadata:
                metadata['last_updated'] = current_time
                fixed = True
            
            if 'bmad_version' not in metadata:
                metadata['bmad_version'] = 'v3.0'
                fixed = True
            
            if 'project_name' not in metadata:
                metadata['project_name'] = 'unnamed-project'
                fixed = True
            
            # Ensure required workflow context
            if 'active_workflow_context' not in data:
                data['active_workflow_context'] = {
                    'current_state': {
                        'active_persona': 'none',
                        'current_phase': 'analyst'
                    }
                }
                fixed = True
            
            # Ensure required memory intelligence state
            if 'memory_intelligence_state' not in data:
                data['memory_intelligence_state'] = {
                    'memory_provider': 'unavailable',
                    'memory_status': 'offline'
                }
                fixed = True
            
            if fixed:
                # Write back the fixed content
                yaml_content = yaml.dump(data, default_flow_style=False, sort_keys=False)
                new_content = f"```yaml\n{yaml_content}\n```"
                
                # Create backup
                backup_path = file_path.with_suffix(file_path.suffix + '.backup')
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Write fixed content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"✅ Fixed common issues. Backup created at {backup_path}")
                return True
            
        except Exception as e:
            print(f"❌ Failed to fix issues: {e}")
            return False
        
        return False

def print_validation_report(result: ValidationResult, file_path: str):
    """Print a comprehensive validation report."""
    print(f"\n🔍 ORCHESTRATOR STATE VALIDATION REPORT")
    print(f"📁 File: {file_path}")
    print(f"📊 Size: {result.file_size:,} bytes")
    print(f"⏱️  Validation time: {result.validation_time:.3f}s")
    print(f"✅ Valid: {'YES' if result.is_valid else 'NO'}")
    
    if result.errors:
        print(f"\n❌ ERRORS ({len(result.errors)}):")
        for i, error in enumerate(result.errors, 1):
            print(f"   {i}. {error}")
    
    if result.warnings:
        print(f"\n⚠️  WARNINGS ({len(result.warnings)}):")
        for i, warning in enumerate(result.warnings, 1):
            print(f"   {i}. {warning}")
    
    if result.suggestions:
        print(f"\n💡 SUGGESTIONS ({len(result.suggestions)}):")
        for i, suggestion in enumerate(result.suggestions, 1):
            print(f"   {i}. {suggestion}")
    
    print(f"\n{'='*60}")
    if result.is_valid:
        print("🎉 ORCHESTRATOR STATE IS VALID!")
    else:
        print("🚨 ORCHESTRATOR STATE HAS ISSUES - SEE ERRORS ABOVE")
    print(f"{'='*60}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Validate BMAD Orchestrator State files')
    parser.add_argument('--file', '-f', default='.ai/orchestrator-state.md',
                       help='Path to orchestrator state file (default: .ai/orchestrator-state.md)')
    parser.add_argument('--fix-common', action='store_true',
                       help='Attempt to fix common validation issues')
    parser.add_argument('--schema', default='.ai/orchestrator-state-schema.yml',
                       help='Path to schema file (default: .ai/orchestrator-state-schema.yml)')
    
    args = parser.parse_args()
    
    try:
        validator = OrchestratorStateValidator(args.schema)
        
        if args.fix_common:
            print("🔧 Attempting to fix common issues...")
            if validator.fix_common_issues(args.file):
                print("✅ Common issues fixed. Re-validating...")
            else:
                print("ℹ️  No common issues found to fix.")
        
        result = validator.validate_file(args.file)
        print_validation_report(result, args.file)
        
        # Exit with appropriate code
        sys.exit(0 if result.is_valid else 1)
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        sys.exit(2)

if __name__ == '__main__':
    main() 