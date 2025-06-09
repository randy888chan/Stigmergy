#!/bin/bash

# Enhanced BMAD System Local Installation Script
# Copies BMAD system and agents from local repository to your project

echo "🚀 Installing Enhanced BMAD System from local repository..."
echo ""

# Get the directory where this script is located (BMAD repository root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📁 BMAD repository found at: $SCRIPT_DIR"

# Function to check if command succeeded
check_success() {
    if [ $? -ne 0 ]; then
        echo "❌ Error: $1"
        exit 1
    fi
}

# Function to convert Windows paths to Unix-style for Git Bash/WSL
normalize_path() {
    local path="$1"
    # Convert Windows drive letters (C:\ -> /c/)
    if [[ "$path" =~ ^[A-Za-z]: ]]; then
        path=$(echo "$path" | sed 's|^\([A-Za-z]\):|/\L\1|' | tr '\\' '/')
    fi
    echo "$path"
}

# Normalize script directory path
SCRIPT_DIR=$(normalize_path "$SCRIPT_DIR")

# Check if we're in the BMAD repository directory (flexible check)
if [ ! -d "$SCRIPT_DIR/bmad-agent" ]; then
    echo "❌ Error: bmad-agent directory not found"
    echo "   Expected location: $SCRIPT_DIR/bmad-agent"
    echo ""
    echo "🔍 Available directories:"
    ls -la "$SCRIPT_DIR" 2>/dev/null || echo "   Cannot list directory contents"
    echo ""
    echo "💡 Manual installation alternative:"
    echo "   mkdir -p .bmad"
    echo "   cp -r $SCRIPT_DIR/bmad-agent .bmad/"
    if [ -d "$SCRIPT_DIR/bmad-system" ]; then
        echo "   cp -r $SCRIPT_DIR/bmad-system/* .bmad/"
    fi
    exit 1
fi

# Create .bmad directory in current project
echo "📁 Creating .bmad directory in your project..."
mkdir -p .bmad
check_success "Failed to create .bmad directory - check write permissions"

# Copy BMAD system documentation (if it exists)
if [ -d "$SCRIPT_DIR/bmad-system" ]; then
    echo "📚 Copying BMAD system documentation..."
    cp -r "$SCRIPT_DIR/bmad-system"/* .bmad/ 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ BMAD system documentation copied"
    else
        echo "   ⚠️  Some BMAD system files may not have copied (this is okay)"
    fi
else
    echo "⚠️  bmad-system directory not found, creating minimal structure..."
    # Create minimal required files
    mkdir -p .bmad/bmad-system
    echo "# BMAD System Documentation" > .bmad/README.md
    echo "The Enhanced BMAD System provides enterprise-grade AI development capabilities." >> .bmad/README.md
fi

# Copy BMAD agents (essential component)
echo "🤖 Copying BMAD agents..."
cp -r "$SCRIPT_DIR/bmad-agent" .bmad/
check_success "Failed to copy BMAD agents - this is required for functionality"

# Create CLAUDE.md file for persistent reference
echo "📝 Creating CLAUDE.md reference file..."
cat > CLAUDE.md << 'EOF'
# BMAD System Reference for Claude Code

## Enhanced BMAD System Available

This project has the Enhanced BMAD System installed in the `.bmad/` directory.

### Quick Start

When starting a new Claude Code session, use this prompt:

```
I have the Enhanced BMAD System installed in my .bmad/ directory.

Please:
1. Read .bmad/README.md to understand the BMAD system capabilities
2. Read .bmad/QUICK_START_CLAUDE_CODE.md for setup guidance  
3. Configure BMAD for my project with these settings:
   - Autonomy Level: Collaborative
   - Learning: Enabled
   - Project Type: [describe your project type]
   - Optimization Focus: [quality/speed/cost]

Available BMAD agents in .bmad/bmad-agent/:
- Architect: System architecture and design
- Developer: Code implementation and optimization
- DevOps: Infrastructure and deployment
- Product Manager: Requirements and planning
- Analyst: Data analysis and insights

Start BMAD-powered development assistance for my project.
```

### BMAD System Structure

```
.bmad/
├── README.md                           # Main BMAD system overview
├── QUICK_START_CLAUDE_CODE.md         # Claude Code integration guide
├── USE_CASES_AND_EXAMPLES.md          # Real-world examples
├── ARCHITECTURE_OVERVIEW.md           # System architecture
├── INTEGRATION_GUIDE.md               # Advanced integration
├── INSTALLATION_GUIDE.md              # Installation reference
├── autonomous-development/             # Autonomous development engine
├── code-intelligence/                  # Advanced code intelligence
├── self-optimization/                  # Self-optimization engine
├── enterprise-architecture/           # Enterprise architecture platform
├── governance/                         # Advanced governance framework
├── strategic-intelligence/             # Strategic intelligence dashboard
├── security-compliance/               # Enterprise security & compliance
├── monitoring-analytics/              # Advanced monitoring & analytics
├── cost-optimization/                  # Cost optimization engine
└── bmad-agent/                        # BMAD agent personas and tasks
    ├── personas/                      # Agent personalities
    ├── tasks/                         # Specialized tasks
    ├── checklists/                    # Quality checklists
    ├── templates/                     # Document templates
    └── data/                          # Knowledge base
```

### Key Capabilities

- **4 Autonomy Levels**: Guided → Collaborative → Supervised → Full
- **Universal LLM Integration**: Claude, GPT-4, Gemini, DeepSeek, Llama
- **Enterprise Features**: Security, compliance, governance, cost optimization  
- **Self-Optimization**: Continuous learning and improvement
- **27 Comprehensive Modules**: Complete development platform
- **Specialized Agents**: Expert personas for different roles

### Usage Examples

#### Start New Feature Development
```
Using BMAD collaborative development, help me implement [feature description].
Reference the BMAD agents and system capabilities in .bmad/ directory.
```

#### Code Review and Optimization  
```
Using BMAD code intelligence, analyze this codebase and suggest improvements.
Apply BMAD optimization principles from .bmad/self-optimization/.
```

#### Architecture Design
```
Using BMAD enterprise architecture, help me design a scalable system.
Reference .bmad/enterprise-architecture/ and .bmad/bmad-agent/personas/architect.md.
```

---

*This file ensures Claude Code can always reference the BMAD system capabilities*
EOF

# Create project-specific BMAD configuration
echo "⚙️ Creating project configuration..."
cat > .bmad/project-config.yml << EOF
# Enhanced BMAD System Project Configuration
bmad_config:
  version: "1.0.0"
  installation_date: "$(date)"
  project_type: "general"  # Options: web_application, mobile_app, enterprise, scientific, gaming
  autonomy_level: "collaborative"  # Options: guided, collaborative, supervised, full
  
  optimization_focus:
    - "quality"
    - "maintainability" 
    - "performance"
  
  learning:
    enabled: true
    adapt_to_style: true
    remember_preferences: true
  
  features:
    code_analysis: true
    automated_testing: true
    performance_monitoring: false
    security_scanning: false
    cost_optimization: false
    
  constraints:
    no_production_changes: true
    require_review: false
    max_autonomy: "supervised"

  agents:
    preferred_personas:
      - "architect"     # System design and architecture
      - "dev.ide"       # IDE-focused development
      - "analyst"       # Analysis and insights
    
    available_tasks:
      - "create-architecture"
      - "create-frontend-architecture" 
      - "review-infrastructure"
      - "advanced-elicitation"

# Customize this configuration for your specific project needs
# See .bmad/bmad-agent/ directory for available personas and tasks
EOF

# Update .gitignore to optionally exclude BMAD (but recommend keeping it)
if [ -f .gitignore ]; then
    if ! grep -q ".bmad/" .gitignore; then
        echo "" >> .gitignore
        echo "# Enhanced BMAD System (uncomment to exclude from git)" >> .gitignore
        echo "#.bmad/" >> .gitignore
        echo "📝 Added optional .bmad/ entry to .gitignore"
    fi
else
    echo "# Enhanced BMAD System (uncomment to exclude from git)" > .gitignore
    echo "#.bmad/" >> .gitignore
    echo "📝 Created .gitignore with optional .bmad/ entry"
fi

# Verify installation
echo ""
echo "🔍 Verifying installation..."

# Check critical components
INSTALLATION_VALID=true

if [ ! -d .bmad ]; then
    echo "❌ .bmad directory not created"
    INSTALLATION_VALID=false
fi

if [ ! -d .bmad/bmad-agent ]; then
    echo "❌ BMAD agents not installed"
    INSTALLATION_VALID=false
fi

if [ ! -f CLAUDE.md ]; then
    echo "❌ CLAUDE.md reference file not created"
    INSTALLATION_VALID=false
fi

if [ "$INSTALLATION_VALID" = true ]; then
    echo "✅ Enhanced BMAD System installed successfully!"
    echo ""
    echo "📁 Installation summary:"
    echo "   📚 BMAD System: .bmad/ (documentation and modules)"
    echo "   🤖 BMAD Agents: .bmad/bmad-agent/ (personas and tasks)"
    echo "   📝 Claude Reference: CLAUDE.md (persistent reference)"
    echo "   ⚙️ Configuration: .bmad/project-config.yml"
    echo ""
    echo "📊 Files installed:"
    
    # Count files more reliably
    MD_COUNT=$(find .bmad -name "*.md" 2>/dev/null | wc -l)
    YML_COUNT=$(find .bmad -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)
    echo "   Documentation files: $MD_COUNT"
    echo "   Configuration files: $YML_COUNT"
    
    echo ""
    echo "🎯 Next steps:"
    echo "1. Open Claude Code in this project directory"
    echo "2. Reference CLAUDE.md for the startup prompt"
    echo "3. Start with: 'I have Enhanced BMAD System in .bmad/ directory'"
    echo "4. Let Claude read the documentation and begin BMAD-powered development"
    echo ""
    echo "📚 Key files to mention to Claude:"
    echo "   - .bmad/README.md (system overview)"
    if [ -f .bmad/QUICK_START_CLAUDE_CODE.md ]; then
        echo "   - .bmad/QUICK_START_CLAUDE_CODE.md (setup guide)"
    fi
    echo "   - .bmad/bmad-agent/ (specialized agents)"
    echo "   - CLAUDE.md (reference guide)"
    echo ""
    echo "🆘 If you encounter issues:"
    echo "   - Make sure you're in your target project directory"
    echo "   - Check file permissions if copying failed"
    echo "   - Run script from the BMAD-METHOD repository root"
    echo "   - Use the manual installation commands shown above if needed"
else
    echo "❌ Installation completed with errors. Manual steps:"
    echo ""
    echo "📝 Manual installation commands:"
    echo "   mkdir -p .bmad"
    echo "   cp -r '$SCRIPT_DIR/bmad-agent' .bmad/"
    if [ -d "$SCRIPT_DIR/bmad-system" ]; then
        echo "   cp -r '$SCRIPT_DIR/bmad-system'/* .bmad/"
    fi
    echo ""
    echo "🔍 Check:"
    echo "   1. You have write permissions in current directory"
    echo "   2. Source files exist in BMAD repository"
    echo "   3. No conflicts with existing .bmad directory"
    exit 1
fi

echo ""
echo "🚀 Enhanced BMAD System ready!"
echo "   Welcome to the future of AI-powered development! 🎉"