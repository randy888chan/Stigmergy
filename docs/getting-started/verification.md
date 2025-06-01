# Setup Verification

Verify that your BMad Method installation is correct and all components are working properly.

## Quick Verification

Run the automated verification script to check your installation:

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

If you see all green checkmarks, your installation is complete! You can skip to [building your first project](first-project.md).

---

## Manual Verification Steps

If the automated script doesn't work or you want to verify manually:

### 1. Repository Structure

Verify that all required directories and files are present:

```bash
# Check core directories
ls -la bmad-agent/
ls -la docs/
ls -la site/

# Verify key files exist
ls -la bmad-agent/ide-bmad-orchestrator.md
ls -la bmad-agent/ide-bmad-orchestrator.cfg.md
ls -la mkdocs.yml
```

**Expected directories:**
- `bmad-agent/` - Core BMad Method system
- `docs/` - Documentation source files
- `site/` - Generated documentation (after running `mkdocs build`)

### 2. Core System Files

Check that essential system files are present and readable:

=== "Key Configuration Files"

    ```bash
    # Orchestrator configuration
    cat bmad-agent/ide-bmad-orchestrator.cfg.md | head -20
    
    # Main orchestrator
    cat bmad-agent/ide-bmad-orchestrator.md | head -20
    
    # Documentation config
    cat mkdocs.yml | head -20
    ```

=== "Personas Directory"

    ```bash
    # List available personas
    ls -la bmad-agent/personas/
    
    # Should show files like:
    # analyst.md, architect.md, pm.md, dev.ide.md, etc.
    ```

=== "Tasks and Templates"

    ```bash
    # Check tasks
    ls -la bmad-agent/tasks/ | head -10
    
    # Check templates
    ls -la bmad-agent/templates/ | head -10
    ```

### 3. Permissions Check

Ensure scripts have proper execution permissions:

```bash
# Verify setup script is executable
ls -la verify-setup.sh
# Should show: -rwxr-xr-x ... verify-setup.sh

# Make executable if needed
chmod +x verify-setup.sh
```

### 4. Git Configuration

Verify Git is properly configured:

```bash
# Check Git version
git --version
# Should show: git version 2.x.x or higher

# Check repository status
git status
# Should show clean working directory or expected changes

# Verify remote origin
git remote -v
# Should show GitHub repository URLs
```

### 5. Documentation Build Test

Test that documentation can be built successfully:

```bash
# Install MkDocs if not already installed
pip install mkdocs-material mkdocs-minify-plugin

# Test documentation build
mkdocs build
# Should complete without errors

# Test local documentation server
mkdocs serve
# Should start server at http://localhost:8000
# Open in browser to verify documentation loads
```

---

## Verification Checklist

Use this checklist to manually verify your installation:

### Core Installation
- [ ] Repository cloned successfully
- [ ] All required directories present (`bmad-agent/`, `docs/`, etc.)
- [ ] Core configuration files exist and are readable
- [ ] Scripts have proper execution permissions
- [ ] Git is configured and repository is clean

### Personas & Tasks
- [ ] Personas directory contains expected files
- [ ] Tasks directory contains expected files
- [ ] Templates directory contains expected files
- [ ] Command registry file exists and is properly formatted

### Documentation System
- [ ] MkDocs configuration is valid
- [ ] Documentation builds without errors
- [ ] Local documentation server starts successfully
- [ ] Documentation website loads and displays correctly

### IDE Integration (Optional)
- [ ] Preferred IDE opens the project without errors
- [ ] If using VS Code: Recommended extensions prompt appears
- [ ] If using Cursor: AI features are accessible
- [ ] Code syntax highlighting works for all file types

---

## Troubleshooting Common Issues

### Verification Script Fails

??? failure "Permission Denied"

    **Error**: `./verify-setup.sh: Permission denied`
    
    **Solution**:
    ```bash
    chmod +x verify-setup.sh
    ./verify-setup.sh
    ```

??? failure "Command Not Found"

    **Error**: `verify-setup.sh: command not found`
    
    **Solution**: Ensure you're in the BMad Method root directory:
    ```bash
    cd /path/to/bmad-method
    ls -la verify-setup.sh
    ./verify-setup.sh
    ```

### Git Issues

??? failure "Git Not Configured"

    **Error**: `fatal: unable to auto-detect email address`
    
    **Solution**: Configure Git with your details:
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

??? failure "Repository Not Found"

    **Error**: `fatal: not a git repository`
    
    **Solution**: Ensure you cloned the repository correctly:
    ```bash
    git clone https://github.com/bmadcode/BMAD-METHOD.git bmad-method
    cd bmad-method
    ```

### Documentation Build Issues

??? failure "MkDocs Not Found"

    **Error**: `mkdocs: command not found`
    
    **Solution**: Install MkDocs and dependencies:
    ```bash
    pip install mkdocs-material mkdocs-minify-plugin
    ```

??? failure "Build Errors"

    **Error**: Various YAML or markdown syntax errors
    
    **Solution**: 
    1. Check the specific error message
    2. Verify `mkdocs.yml` syntax
    3. Ensure all referenced files exist
    4. Run `mkdocs build --strict` for detailed error info

### IDE Integration Issues

??? failure "VS Code Extensions"

    **Problem**: Recommended extensions don't install
    
    **Solution**:
    ```bash
    code --install-extension ms-python.python
    code --install-extension yzhang.markdown-all-in-one
    ```

??? failure "Cursor AI Features"

    **Problem**: AI features not working
    
    **Solution**: 
    1. Ensure Cursor is properly licensed
    2. Check internet connection
    3. Verify AI provider settings

---

## System Requirements Verification

Ensure your system meets the minimum requirements:

### Operating System Support
- ✅ **macOS**: 10.14 (Mojave) or later
- ✅ **Linux**: Ubuntu 18.04+ or equivalent
- ✅ **Windows**: Windows 10 or later with WSL2 (recommended)

### Software Dependencies
- ✅ **Git**: Version 2.20 or later
- ✅ **Python**: 3.8 or later (for automation scripts)
- ✅ **Node.js**: 16+ (if using JavaScript tooling)
- ✅ **Modern IDE**: VS Code, Cursor, or JetBrains

### Hardware Recommendations
- 💾 **Storage**: 1GB free space minimum
- 🧠 **Memory**: 4GB RAM minimum (8GB+ recommended)
- 🔗 **Network**: Internet connection for documentation updates

---

## Next Steps

✅ **Verification Complete!** 

Now that your installation is verified, you're ready to build your first project:

[:octicons-arrow-right-24: **Build Your First Project**](first-project.md){ .md-button .md-button--primary }

**Or explore other options:**

- [🎯 Learn Core Commands](../commands/quick-reference.md)
- [🔄 Explore Workflows](first-project.md)
- [📖 Browse Examples](first-project.md)
- [📋 Quick Reference](../reference/personas.md)

**Having issues?** Check our troubleshooting guide in the first project tutorial or [create an issue](https://github.com/bmadcode/BMAD-METHOD/issues) for help. 