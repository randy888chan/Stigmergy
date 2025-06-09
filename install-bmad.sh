#!/bin/bash

# Enhanced BMAD System Local Installation Script
# Copies BMAD system and agents from local repository to your project

echo "🚀 Installing Enhanced BMAD System from local repository..."
echo ""

# Get the directory where this script is located (BMAD repository root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📁 BMAD repository found at: $SCRIPT_DIR"

# Check if we're in the BMAD repository directory
if [ ! -d "$SCRIPT_DIR/bmad-system" ] || [ ! -d "$SCRIPT_DIR/bmad-agent" ]; then
    echo "❌ Error: This script must be run from the BMAD-METHOD repository directory"
    echo "   Make sure you have bmad-system/ and bmad-agent/ directories"
    exit 1
fi

# Create .bmad directory in current project
echo "📁 Creating .bmad directory in your project..."
mkdir -p .bmad

# Copy BMAD system documentation
echo "📚 Copying BMAD system documentation..."
cp -r "$SCRIPT_DIR/bmad-system"/* .bmad/

# Copy BMAD agents
echo "🤖 Copying BMAD agents..."
cp -r "$SCRIPT_DIR/bmad-agent" .bmad/

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
if [ -d .bmad/bmad-system ] || [ -f .bmad/README.md ]; then
    if [ -d .bmad/bmad-agent ]; then
        echo "✅ Enhanced BMAD System installed successfully!"
        echo ""
        echo "📁 Installation summary:"
        echo "   📚 BMAD System: .bmad/ (documentation and modules)"
        echo "   🤖 BMAD Agents: .bmad/bmad-agent/ (personas and tasks)"
        echo "   📝 Claude Reference: CLAUDE.md (persistent reference)"
        echo "   ⚙️ Configuration: .bmad/project-config.yml"
        echo ""
        echo "📊 Files installed:"
        find .bmad -name "*.md" | wc -l | xargs echo "   Documentation files:"
        find .bmad -name "*.yml" -o -name "*.yaml" | wc -l | xargs echo "   Configuration files:"
        echo ""
        echo "🎯 Next steps:"
        echo "1. Open Claude Code in this project directory"
        echo "2. Reference CLAUDE.md for the startup prompt"
        echo "3. Start with: 'I have Enhanced BMAD System in .bmad/ directory'"
        echo "4. Let Claude read the documentation and begin BMAD-powered development"
        echo ""
        echo "📚 Key files to mention to Claude:"
        echo "   - .bmad/README.md (system overview)"
        echo "   - .bmad/QUICK_START_CLAUDE_CODE.md (setup guide)"
        echo "   - .bmad/bmad-agent/ (specialized agents)"
        echo "   - CLAUDE.md (reference guide)"
    else
        echo "⚠️  BMAD system installed but agents directory missing"
        echo "   Please check that bmad-agent/ directory exists in source"
    fi
else
    echo "❌ Installation failed. Please check:"
    echo "   1. You're running this from the BMAD-METHOD directory"
    echo "   2. bmad-system/ and bmad-agent/ directories exist"
    echo "   3. You have write permissions in current directory"
    exit 1
fi

echo ""
echo "🚀 Enhanced BMAD System ready!"
echo "   Welcome to the future of AI-powered development! 🎉"