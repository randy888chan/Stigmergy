# Enhanced BMAD System Installation Guide

## 🎯 Installation Overview

The Enhanced BMAD System is designed to work **directly with Claude Code** by copying documentation and configuration files to your project. This guide provides step-by-step installation instructions.

## 📋 What You Need

- **Claude Code** (any plan - Free, Pro, or Max)
- **Git** (for downloading BMAD files)
- **Project directory** (new or existing)

## 🚀 Installation Methods

### Method 1: Download and Copy (Recommended)

#### Step 1: Download BMAD System
```bash
# Download the BMAD repository
git clone https://github.com/anthropics/BMAD-METHOD.git
cd BMAD-METHOD
```

#### Step 2: Copy Files to Your Project

**For New Projects:**
```bash
# Create your project
mkdir my-awesome-project
cd my-awesome-project

# Create BMAD directory
mkdir .bmad

# Copy essential BMAD files
cp ../BMAD-METHOD/bmad-system/README.md .bmad/
cp ../BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
cp ../BMAD-METHOD/bmad-system/USE_CASES_AND_EXAMPLES.md .bmad/
cp ../BMAD-METHOD/bmad-system/ARCHITECTURE_OVERVIEW.md .bmad/
cp ../BMAD-METHOD/bmad-system/INTEGRATION_GUIDE.md .bmad/

# Initialize your project
git init
echo "# My Awesome Project with BMAD" > README.md
```

**For Existing Projects:**
```bash
# In your existing project root
mkdir .bmad

# Copy BMAD files (adjust path as needed)
cp /path/to/BMAD-METHOD/bmad-system/README.md .bmad/
cp /path/to/BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
cp /path/to/BMAD-METHOD/bmad-system/USE_CASES_AND_EXAMPLES.md .bmad/
cp /path/to/BMAD-METHOD/bmad-system/ARCHITECTURE_OVERVIEW.md .bmad/
```

### Method 2: One-Line Installation Script

Create this installation script:

```bash
#!/bin/bash
# install-bmad.sh

echo "🚀 Installing Enhanced BMAD System..."

# Create .bmad directory
mkdir -p .bmad

# Download BMAD files directly
curl -o .bmad/README.md https://raw.githubusercontent.com/anthropics/BMAD-METHOD/main/bmad-system/README.md
curl -o .bmad/QUICK_START_CLAUDE_CODE.md https://raw.githubusercontent.com/anthropics/BMAD-METHOD/main/bmad-system/QUICK_START_CLAUDE_CODE.md
curl -o .bmad/USE_CASES_AND_EXAMPLES.md https://raw.githubusercontent.com/anthropics/BMAD-METHOD/main/bmad-system/USE_CASES_AND_EXAMPLES.md
curl -o .bmad/ARCHITECTURE_OVERVIEW.md https://raw.githubusercontent.com/anthropics/BMAD-METHOD/main/bmad-system/ARCHITECTURE_OVERVIEW.md

echo "✅ BMAD System installed successfully!"
echo "Next: Open Claude Code and reference .bmad/ files"
```

Use it:
```bash
# Download and run installer
curl -o install-bmad.sh https://raw.githubusercontent.com/anthropics/BMAD-METHOD/main/install-bmad.sh
chmod +x install-bmad.sh
./install-bmad.sh
```

## 📁 File Structure After Installation

Your project should look like this:

```
your-project/
├── .bmad/                              # BMAD System Directory
│   ├── README.md                       # Core system overview (REQUIRED)
│   ├── QUICK_START_CLAUDE_CODE.md     # Claude Code integration guide
│   ├── USE_CASES_AND_EXAMPLES.md      # Real-world examples and patterns
│   ├── ARCHITECTURE_OVERVIEW.md       # System architecture diagrams
│   └── INTEGRATION_GUIDE.md           # Advanced integration patterns
├── src/                               # Your application source code
├── tests/                             # Your test files
├── package.json                       # Your project dependencies
├── .gitignore                         # Git ignore file
└── README.md                          # Your project README
```

## ✅ Verify Installation

### Step 1: Check Files
```bash
# Verify BMAD files are in place
ls -la .bmad/
# Should show: README.md, QUICK_START_CLAUDE_CODE.md, etc.
```

### Step 2: Test with Claude Code

Open Claude Code in your project directory and run this test:

```
I have installed the Enhanced BMAD System in my .bmad/ directory.

Please read .bmad/README.md and confirm:
1. Can you access the BMAD system documentation?
2. What are the key capabilities available?
3. What autonomy levels are supported?

Test the BMAD system integration.
```

**Expected Response:**
```
✅ Enhanced BMAD System detected and loaded!

I can access your BMAD documentation. Key capabilities include:

1. Autonomous Development (4 levels: Guided → Collaborative → Supervised → Full)
2. Universal LLM Integration 
3. Enterprise Features (Security, Compliance, Governance)
4. Self-Optimization and Learning
5. Advanced Code Intelligence

System is ready for intelligent development assistance!
```

## 🎯 Configuration Options

### Minimal Installation (Most Projects)
Copy only essential files:
```bash
mkdir .bmad
cp BMAD-METHOD/bmad-system/README.md .bmad/
cp BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
```

### Standard Installation (Recommended)
Copy core documentation:
```bash
mkdir .bmad
cp BMAD-METHOD/bmad-system/README.md .bmad/
cp BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
cp BMAD-METHOD/bmad-system/USE_CASES_AND_EXAMPLES.md .bmad/
cp BMAD-METHOD/bmad-system/ARCHITECTURE_OVERVIEW.md .bmad/
```

### Full Installation (Enterprise)
Copy all documentation and modules:
```bash
mkdir .bmad
cp -r BMAD-METHOD/bmad-system/* .bmad/
```

## 🔧 Project-Specific Configuration

### Web Application Setup
```bash
# Standard BMAD installation
mkdir .bmad
cp BMAD-METHOD/bmad-system/README.md .bmad/
cp BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
cp BMAD-METHOD/bmad-system/USE_CASES_AND_EXAMPLES.md .bmad/

# Create project-specific BMAD config
cat > .bmad/project-config.yml << EOF
bmad_config:
  project_type: "web_application"
  tech_stack: ["react", "node", "postgres"]
  autonomy_level: "collaborative"
  optimization_focus: ["performance", "maintainability"]
  features:
    - code_analysis
    - automated_testing
    - performance_monitoring
EOF
```

### Mobile App Setup
```bash
# BMAD installation for mobile
mkdir .bmad
cp BMAD-METHOD/bmad-system/README.md .bmad/
cp BMAD-METHOD/bmad-system/QUICK_START_CLAUDE_CODE.md .bmad/
cp BMAD-METHOD/bmad-system/USE_CASES_AND_EXAMPLES.md .bmad/

# Mobile-specific config
cat > .bmad/project-config.yml << EOF
bmad_config:
  project_type: "mobile_application"
  platforms: ["ios", "android"]
  framework: "react_native"
  autonomy_level: "supervised"
  optimization_focus: ["performance", "battery", "size"]
EOF
```

### Enterprise Setup
```bash
# Full BMAD installation for enterprise
mkdir .bmad
cp -r BMAD-METHOD/bmad-system/* .bmad/

# Enterprise config
cat > .bmad/project-config.yml << EOF
bmad_config:
  project_type: "enterprise_application"
  compliance_frameworks: ["SOX", "GDPR", "HIPAA"]
  autonomy_level: "guided"
  security_level: "high"
  features:
    - security_scanning
    - compliance_checking
    - audit_logging
    - governance_controls
EOF
```

## 🚨 Common Issues and Solutions

### Issue: Files Not Found
```bash
# Check if .bmad directory exists
ls -la .bmad/

# If missing, recreate:
mkdir .bmad
# Re-copy files
```

### Issue: Claude Code Can't Access Files
Make sure you're in the correct directory:
```bash
# Check current directory
pwd
# Should be your project root with .bmad/ folder

# Check Claude Code can see files
ls .bmad/
```

### Issue: Permission Errors
```bash
# Fix permissions
chmod -R 755 .bmad/
```

## 🎯 Next Steps After Installation

1. **Test Integration**: Run the verification steps above
2. **Read Documentation**: Start with `.bmad/QUICK_START_CLAUDE_CODE.md`
3. **Choose Use Case**: Review `.bmad/USE_CASES_AND_EXAMPLES.md`
4. **Configure Project**: Set autonomy level and optimization focus
5. **Start Development**: Begin your first BMAD-powered Claude Code session

## 📚 Additional Resources

- **Getting Started**: Read `.bmad/README.md`
- **Quick Setup**: Follow `.bmad/QUICK_START_CLAUDE_CODE.md`
- **Real Examples**: Browse `.bmad/USE_CASES_AND_EXAMPLES.md`
- **Advanced Integration**: Study `.bmad/INTEGRATION_GUIDE.md`

## 🎉 You're Ready!

After installation, start your first BMAD-powered development session with:

```
I have the Enhanced BMAD System installed in .bmad/

Please read the documentation and help me build my project using BMAD collaborative development.

Project: [describe your project]
```

Welcome to the future of AI-powered development! 🚀