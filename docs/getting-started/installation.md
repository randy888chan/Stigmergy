# Installation Guide

Get BMad Method installed and configured on your development machine in under 10 minutes.

## Quick Install (Recommended)

For most users, this one-command installation will get everything set up:

```bash
git clone https://github.com/danielbentes/DMAD-METHOD.git bmad-method
cd bmad-method
./verify-setup.sh
```

!!! success "That's it!"
    If the verification script shows all green checkmarks, you're ready to go! Skip to [verification](verification.md) to confirm everything is working.

---

## Detailed Installation

If you prefer to understand each step or encounter issues with the quick install:

### Step 1: Clone the Repository

Choose your preferred location and clone the BMad Method repository:

=== "HTTPS (Recommended)"

    ```bash
    git clone https://github.com/danielbentes/DMAD-METHOD.git bmad-method
    cd bmad-method
    ```

=== "SSH"

    ```bash
    git clone git@github.com:danielbentes/DMAD-METHOD.git bmad-method
    cd bmad-method
    ```

### Step 2: Verify Prerequisites

Ensure you have the required tools installed:

=== "macOS"

    ```bash
    # Check Git
    git --version
    # Should show: git version 2.x.x or higher
    
    # Check Python (optional, for automation scripts)
    python3 --version
    # Should show: Python 3.8+ (if you want to use automation features)
    ```

=== "Linux"

    ```bash
    # Check Git
    git --version
    
    # Check Python (optional)
    python3 --version
    
    # Install if missing (Ubuntu/Debian)
    sudo apt update
    sudo apt install git python3 python3-pip
    ```

=== "Windows"

    ```powershell
    # Check Git
    git --version
    
    # Check Python (optional)
    python --version
    
    # If missing, install from:
    # Git: https://git-scm.com/download/win
    # Python: https://python.org/downloads/
    ```

### Step 3: Configure Your Environment

BMad Method works best with proper environment configuration:

```bash
# Make scripts executable (macOS/Linux)
chmod +x verify-setup.sh

# Optional: Add bmad-method to your PATH for global access
echo 'export PATH="$PATH:$(pwd)"' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or ~/.zshrc
```

### Step 4: IDE Setup

BMad Method integrates with popular IDEs for the best experience:

=== "VS Code (Recommended)"

    1. **Install VS Code** if you haven't already: [code.visualstudio.com](https://code.visualstudio.com/)
    
    2. **Install recommended extensions**:
       ```bash
       code --install-extension ms-python.python
       code --install-extension ms-vscode.vscode-json
       code --install-extension yzhang.markdown-all-in-one
       ```
    
    3. **Open BMad Method in VS Code**:
       ```bash
       code .
       ```
    
    4. **Configure workspace settings** (optional):
       - VS Code will prompt to install recommended extensions
       - Accept the workspace configuration for optimal experience

=== "Cursor"

    1. **Install Cursor**: [cursor.sh](https://cursor.sh/)
    
    2. **Open BMad Method**:
       ```bash
       cursor .
       ```
    
    3. **Configure AI features**:
       - BMad Method works excellently with Cursor's AI capabilities
       - The methodology enhances AI coding assistance with structure and quality

=== "JetBrains IDEs"

    1. **Open the project** in your preferred JetBrains IDE
    
    2. **Configure for your language**:
       - PyCharm for Python projects
       - WebStorm for JavaScript/TypeScript
       - IntelliJ IDEA for Java or multi-language
    
    3. **Enable AI assistant** if available (GitHub Copilot, JetBrains AI, etc.)

### Step 5: Verify Installation

Run the verification script to ensure everything is set up correctly:

```bash
./verify-setup.sh
```

**Expected output:**
```
✅ BMad Method Installation Verification
✅ Git configuration: OK
✅ Repository structure: OK  
✅ Permissions: OK
✅ Documentation: OK
✅ Core components: OK

🎉 BMad Method is ready to use!

Next steps:
→ Run 'bmad /help' to see available commands
→ Visit the getting started guide: docs/getting-started/
→ Try your first project: docs/getting-started/first-project.md
```

---

## Installation Troubleshooting

### Common Issues

??? failure "Permission denied when running scripts"

    **Problem**: `./verify-setup.sh: Permission denied`
    
    **Solution**:
    ```bash
    chmod +x verify-setup.sh
    ./verify-setup.sh
    ```

??? failure "Git not found"

    **Problem**: `git: command not found`
    
    **Solution**: Install Git for your operating system:
    
    - **macOS**: `brew install git` or download from [git-scm.com](https://git-scm.com/)
    - **Linux**: `sudo apt install git` (Ubuntu) or equivalent for your distro
    - **Windows**: Download from [git-scm.com](https://git-scm.com/download/win)

??? failure "Python not found (for automation scripts)"

    **Problem**: `python3: command not found`
    
    **Solution**: Python is optional but recommended:
    
    - **macOS**: `brew install python3` or use the built-in version
    - **Linux**: `sudo apt install python3 python3-pip`
    - **Windows**: Download from [python.org](https://python.org/downloads/)

??? failure "Repository clone failed"

    **Problem**: `fatal: could not read Username for 'https://github.com'`
    
    **Solutions**:
    
    1. **Use HTTPS with no authentication** (public repo):
       ```bash
       git clone https://github.com/danielbentes/DMAD-METHOD.git
       ```
    
    2. **Configure Git credentials** if needed:
       ```bash
       git config --global user.name "Your Name"
       git config --global user.email "your.email@example.com"
       ```

### Getting Help

If you're still experiencing issues:

1. **Check the verification output** - it often provides specific guidance
2. **Review the troubleshooting examples in the verification guide**
3. **Search existing [GitHub Issues](https://github.com/danielbentes/DMAD-METHOD/issues)**
4. **Create a new issue** with your system details and error messages

---

## Optional Enhancements

Once you have the basic installation working, consider these optional enhancements:

### Command Aliases

Add convenient aliases to your shell configuration:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias bmad='cd /path/to/bmad-method && ./bmad-orchestrator.sh'
alias bmad-verify='cd /path/to/bmad-method && ./verify-setup.sh'
```

### IDE Optimizations

- **Configure your AI assistant** to work with BMad Method patterns
- **Set up code snippets** for common BMad workflows
- **Configure linting and formatting** according to BMad Method standards

### Shell Integration

For advanced users who want deeper shell integration:

```bash
# Add to your shell configuration
export BMAD_HOME="/path/to/bmad-method"
export PATH="$PATH:$BMAD_HOME"

# Optional: Auto-activate BMad context when entering project directories
# (Advanced - see documentation for details)
```

---

## Next Steps

✅ **Installation Complete!** 

Now verify your setup and build your first project:

[:octicons-arrow-right-24: **Verify Your Installation**](verification.md){ .md-button .md-button--primary }

**Or jump straight to:**

- [🚀 Build Your First Project](first-project.md)
- [📖 Learn Commands](../commands/quick-reference.md)  
- [🔧 Explore Workflows](first-project.md) 