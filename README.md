# The BMAD-Method 3.1 (Breakthrough Method of Agile (ai-driven) Development)

## 🚀 Enhanced BMAD System Available!

**NEW**: The Enhanced BMAD System provides enterprise-grade, autonomous development capabilities with Claude Code integration!

### Quick Start with Enhanced BMAD System (Recommended for Claude Code Users)

#### Local Installation from Downloaded Repository

**Option 1: Automatic Installation (Recommended)**
```bash
# Download or clone this repository first
git clone https://github.com/your-repo/BMAD-METHOD.git
cd BMAD-METHOD

# Copy install script to your project directory
cp install-bmad.sh /path/to/your-project/
cd /path/to/your-project/

# Run the installation script
chmod +x install-bmad.sh
./install-bmad.sh
```

**Option 2: Windows Users**
```cmd
# Download or clone this repository first
git clone https://github.com/your-repo/BMAD-METHOD.git
cd BMAD-METHOD

# Copy install script to your project directory
copy install-bmad.bat C:\path\to\your-project\
cd C:\path\to\your-project\

# Run the Windows installation script
install-bmad.bat
```

**Option 3: Manual Installation (If scripts fail)**
```bash
# From the BMAD-METHOD directory
mkdir /path/to/your-project/.bmad
cp -r bmad-agent /path/to/your-project/.bmad/
cp -r bmad-system/* /path/to/your-project/.bmad/ 2>/dev/null || true
```

#### Use with Claude Code
After installation, start Claude Code in your project:
```
Please read CLAUDE.md for the BMAD system setup guide and use the recommended startup prompt.
```

Or directly:
```
I have the Enhanced BMAD System installed in my .bmad/ directory.
Please read the documentation and help me build my project using BMAD intelligence.
```

**Enhanced System Features**: 4 autonomy levels, universal LLM integration, enterprise features, self-optimization, 27 comprehensive modules.

#### Installation Troubleshooting

**Common Issues:**

1. **"bmad-agent directory not found" error:**
   ```bash
   # Make sure you're running from BMAD-METHOD root directory
   ls -la  # Should show bmad-agent/ directory
   ```

2. **Permission denied errors:**
   ```bash
   # Make script executable (Linux/Mac)
   chmod +x install-bmad.sh
   
   # Or use manual installation
   mkdir -p .bmad
   cp -r /path/to/BMAD-METHOD/bmad-agent .bmad/
   ```

3. **Windows line ending issues:**
   ```bash
   # Convert line endings if needed
   dos2unix install-bmad.sh
   
   # Or use the Windows batch file instead
   install-bmad.bat
   ```

4. **Git Bash/WSL path issues:**
   ```bash
   # Use full paths if relative paths fail
   /c/path/to/BMAD-METHOD/install-bmad.sh
   ```

📚 **Full Documentation**: See `/bmad-system/` directory for complete guides.

---

## Original BMAD Method

Old Versions:
[Prior Version 1](https://github.com/bmadcode/BMAD-METHOD/tree/V1)
[Prior Version 2](https://github.com/bmadcode/BMAD-METHOD/tree/V2)

### Web Quickstart Project Setup (Original Method)

Orchestrator Uber BMad Agent that does it all - already pre-compiled in the `web-build-sample` folder.

- The contents of [Agent Prompt Sample](web-build-sample/agent-prompt.txt) text get pasted into the Gemini Gem, or ChatPGT customGPT 'Instructions' field.
- The remaining files in that same folder folder just need to be attached as shown in the screenshot below. Give it a name (such as BMad Agent) and save it, and you now have the BMad Agent available to help you brainstorm, research, plan, execute on your vision, or understand how this all even works!
- Once its running, start with typing `/help`, and then type option `2` when it presents 3 options to learn about the method!

![image info](docs/images/gem-setup.png)

[More Documentation, Explanations, and IDE Specifics](docs/readme.md) available here!

## End Matter

Interested in improving the BMAD Method? See the [contributing guidelines](docs/CONTRIBUTING.md).

Thank you and enjoy - BMad!
[License](docs/LICENSE)
