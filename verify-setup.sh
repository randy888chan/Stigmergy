#!/bin/bash

# BMAD Method Setup Verification Script
# Checks system coherence and reports any issues

echo "================================================"
echo "BMAD Method Setup Verification v3.x"
echo "================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 - Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 - Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check file references
check_reference() {
    if grep -q "$1" "$2" 2>/dev/null; then
        if [ -f "$3" ]; then
            echo -e "${GREEN}✓${NC} Reference valid: $1 in $2"
            return 0
        else
            echo -e "${RED}✗${NC} Broken reference: $1 in $2 (file not found: $3)"
            ((ERRORS++))
            return 1
        fi
    fi
    return 0
}

# Function to warn about future features
warn_future() {
    echo -e "${YELLOW}!${NC} Future enhancement: $1"
    ((WARNINGS++))
}

echo "1. Checking Core Directories..."
echo "================================"
check_dir "bmad-agent" "BMAD agent root directory"
check_dir "bmad-agent/personas" "Personas directory"
check_dir "bmad-agent/tasks" "Tasks directory"
check_dir "bmad-agent/templates" "Templates directory"
check_dir "bmad-agent/checklists" "Checklists directory"
check_dir "bmad-agent/data" "Data directory"
check_dir "bmad-agent/memory" "Memory directory"
check_dir "bmad-agent/consultation" "Consultation directory"
check_dir "bmad-agent/config" "Configuration directory"
check_dir "bmad-agent/workflows" "Workflows directory"
check_dir "bmad-agent/error_handling" "Error handling directory"
check_dir "bmad-agent/quality-tasks" "Quality tasks directory"
check_dir ".ai" "AI session state directory"
check_dir "bmad-agent/commands" "Commands directory"

echo ""
echo "2. Checking Future Enhancement Directories..."
echo "=============================================="
if [ ! -d "bmad-agent/quality-checklists" ]; then
    warn_future "quality-checklists directory (not yet implemented)"
fi
if [ ! -d "bmad-agent/quality-templates" ]; then
    warn_future "quality-templates directory (not yet implemented)"
fi
if [ ! -d "bmad-agent/quality-metrics" ]; then
    warn_future "quality-metrics directory (not yet implemented)"
fi

echo ""
echo "3. Checking Core Configuration Files..."
echo "========================================"
check_file "bmad-agent/ide-bmad-orchestrator.cfg.md" "IDE orchestrator configuration"
check_file "bmad-agent/ide-bmad-orchestrator.md" "IDE orchestrator documentation"
check_file "bmad-agent/web-bmad-orchestrator-agent.cfg.md" "Web orchestrator configuration"
check_file "bmad-agent/web-bmad-orchestrator-agent.md" "Web orchestrator documentation"
check_file "bmad-agent/config/performance-settings.yml" "Performance settings"

echo ""
echo "4. Checking Workflow Files..."
echo "=============================="
if [ -f "bmad-agent/workflows/standard-workflows.yml" ]; then
    echo -e "${GREEN}✓${NC} Workflow file has correct extension (.yml)"
elif [ -f "bmad-agent/workflows/standard-workflows.txt" ]; then
    echo -e "${YELLOW}!${NC} Workflow file has incorrect extension (.txt should be .yml)"
    ((WARNINGS++))
else
    echo -e "${RED}✗${NC} Workflow file missing"
    ((ERRORS++))
fi

echo ""
echo "5. Checking Memory System Files..."
echo "==================================="
check_file "bmad-agent/memory/memory-system-architecture.md" "Memory system architecture"
check_file "bmad-agent/tasks/memory-operations-task.md" "Memory operations task"
check_file "bmad-agent/tasks/memory-bootstrap-task.md" "Memory bootstrap task"
check_file "bmad-agent/tasks/memory-context-restore-task.md" "Memory context restore task"

echo ""
echo "6. Checking All Personas..."
echo "============================"
for persona in analyst architect bmad design-architect dev.ide pm po quality_enforcer sm.ide sm; do
    check_file "bmad-agent/personas/${persona}.md" "Persona: ${persona}"
done

echo ""
echo "7. Checking Quality Tasks..."
echo "============================="
quality_tasks=(
    "ultra-deep-thinking-mode"
    "architecture-udtm-analysis"
    "requirements-udtm-analysis"
    "technical-decision-validation"
    "technical-standards-enforcement"
    "test-coverage-requirements"
    "code-review-standards"
    "evidence-requirements-prioritization"
    "story-quality-validation"
    "quality-metrics-tracking"
)

for task in "${quality_tasks[@]}"; do
    check_file "bmad-agent/quality-tasks/${task}.md" "Quality task: ${task}"
done

echo ""
echo "8. Checking Core Tasks..."
echo "=========================="
core_tasks=(
    "quality_gate_validation"
    "brotherhood_review"
    "anti_pattern_detection"
    "create-prd"
    "create-next-story-task"
    "doc-sharding-task"
    "checklist-run-task"
    "udtm_task"
)

for task in "${core_tasks[@]}"; do
    check_file "bmad-agent/tasks/${task}.md" "Core task: ${task}"
done

echo ""
echo "9. Checking Placeholder Files..."
echo "================================="
check_file "bmad-agent/data/workflow-intelligence.md" "Workflow intelligence KB"
check_file "bmad-agent/commands/command-registry.yml" "Command registry"

echo ""
echo "10. Checking File References in Configuration..."
echo "================================================"
if [ -f "bmad-agent/ide-bmad-orchestrator.cfg.md" ]; then
    # Extract .md and .yml file references more carefully - avoid partial matches
    references=$(grep -o '\b[a-zA-Z0-9][a-zA-Z0-9_.-]*\.\(md\|yml\)\b' bmad-agent/ide-bmad-orchestrator.cfg.md | sort -u)
    
    for filename in $references; do
        # Skip files that are explicitly marked as "In Memory" context
        if grep -q "$filename.*Memory Already" bmad-agent/ide-bmad-orchestrator.cfg.md; then
            continue
        fi
        
        # Skip comment lines and notes
        if grep -q "^#.*$filename" bmad-agent/ide-bmad-orchestrator.cfg.md; then
            continue
        fi
        
        # Skip false positives (partial extractions)
        case "$filename" in
            "ide.md"|"web.md"|"cfg.md")
                continue
                ;;
        esac
        
        found=false
        
        # Check known files with specific locations first
        case "$filename" in
            "bmad-kb.md")
                [ -f "bmad-agent/data/$filename" ] && found=true
                ;;
            "workflow-intelligence.md")
                [ -f "bmad-agent/data/$filename" ] && found=true
                ;;
            "multi-persona-protocols.md")
                [ -f "bmad-agent/consultation/$filename" ] && found=true
                ;;
            "fallback-personas.md"|"error-recovery.md")
                [ -f "bmad-agent/error_handling/$filename" ] && found=true
                ;;
            "orchestrator-state.md"|"error-log.md")
                [ -f ".ai/$filename" ] && found=true
                ;;
            "performance-settings.yml")
                [ -f "bmad-agent/config/$filename" ] && found=true
                ;;
            "command-registry.yml")
                [ -f "bmad-agent/commands/$filename" ] && found=true
                ;;
            "standard-workflows.yml")
                [ -f "bmad-agent/workflows/$filename" ] && found=true
                ;;
            *)
                # Search in standard directories for other files
                for dir in tasks quality-tasks personas templates checklists memory consultation error_handling data config commands workflows; do
                    if [ -f "bmad-agent/${dir}/${filename}" ]; then
                        found=true
                        break
                    fi
                done
                # Also check .ai directory for state files
                [ -f ".ai/${filename}" ] && found=true
                ;;
        esac
        
        if [ "$found" = false ]; then
            echo -e "${YELLOW}!${NC} Missing referenced file: ${filename}"
            ((WARNINGS++))
        fi
    done
fi

echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"
echo -e "Errors: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}✓ BMAD system is fully configured and ready!${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠ BMAD system is functional but has some warnings.${NC}"
        echo "Future enhancements are marked but don't affect current operation."
        exit 0
    fi
else
    echo -e "\n${RED}✗ BMAD system has configuration errors that need to be fixed.${NC}"
    echo "Please run the fixes suggested above or consult the troubleshooting guide."
    exit 1
fi 