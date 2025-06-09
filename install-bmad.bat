@echo off
rem Enhanced BMAD System Windows Installation Script
rem Copies BMAD system and agents from local repository to your project

echo 🚀 Installing Enhanced BMAD System from local repository...
echo.

rem Get the directory where this script is located (BMAD repository root)
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
echo 📁 BMAD repository found at: %SCRIPT_DIR%

rem Check if we're in the BMAD repository directory
if not exist "%SCRIPT_DIR%\bmad-agent" (
    echo ❌ Error: bmad-agent directory not found
    echo    Expected location: %SCRIPT_DIR%\bmad-agent
    echo.
    echo 🔍 Available directories:
    dir "%SCRIPT_DIR%" /B /AD 2>nul
    echo.
    echo 💡 Manual installation alternative:
    echo    mkdir .bmad
    echo    xcopy "%SCRIPT_DIR%\bmad-agent" .bmad\bmad-agent\ /E /I /Y
    if exist "%SCRIPT_DIR%\bmad-system" (
        echo    xcopy "%SCRIPT_DIR%\bmad-system" .bmad\ /E /Y
    )
    pause
    exit /b 1
)

rem Create .bmad directory in current project
echo 📁 Creating .bmad directory in your project...
mkdir .bmad 2>nul
if errorlevel 1 (
    echo ❌ Error: Failed to create .bmad directory - check write permissions
    pause
    exit /b 1
)

rem Copy BMAD system documentation (if it exists)
if exist "%SCRIPT_DIR%\bmad-system" (
    echo 📚 Copying BMAD system documentation...
    xcopy "%SCRIPT_DIR%\bmad-system" .bmad\ /E /Y /Q >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️  Some BMAD system files may not have copied ^(this is okay^)
    ) else (
        echo    ✅ BMAD system documentation copied
    )
) else (
    echo ⚠️  bmad-system directory not found, creating minimal structure...
    mkdir .bmad\bmad-system 2>nul
    echo # BMAD System Documentation > .bmad\README.md
    echo The Enhanced BMAD System provides enterprise-grade AI development capabilities. >> .bmad\README.md
)

rem Copy BMAD agents (essential component)
echo 🤖 Copying BMAD agents...
xcopy "%SCRIPT_DIR%\bmad-agent" .bmad\bmad-agent\ /E /I /Y /Q >nul
if errorlevel 1 (
    echo ❌ Error: Failed to copy BMAD agents - this is required for functionality
    pause
    exit /b 1
)

rem Create CLAUDE.md file for persistent reference
echo 📝 Creating CLAUDE.md reference file...
(
echo # BMAD System Reference for Claude Code
echo.
echo ## Enhanced BMAD System Available
echo.
echo This project has the Enhanced BMAD System installed in the `.bmad/` directory.
echo.
echo ### Quick Start
echo.
echo When starting a new Claude Code session, use this prompt:
echo.
echo ```
echo I have the Enhanced BMAD System installed in my .bmad/ directory.
echo.
echo Please:
echo 1. Read .bmad/README.md to understand the BMAD system capabilities
echo 2. Read .bmad/QUICK_START_CLAUDE_CODE.md for setup guidance  
echo 3. Configure BMAD for my project with these settings:
echo    - Autonomy Level: Collaborative
echo    - Learning: Enabled
echo    - Project Type: [describe your project type]
echo    - Optimization Focus: [quality/speed/cost]
echo.
echo Available BMAD agents in .bmad/bmad-agent/:
echo - Architect: System architecture and design
echo - Developer: Code implementation and optimization
echo - DevOps: Infrastructure and deployment
echo - Product Manager: Requirements and planning
echo - Analyst: Data analysis and insights
echo.
echo Start BMAD-powered development assistance for my project.
echo ```
echo.
echo ### Key Capabilities
echo.
echo - **4 Autonomy Levels**: Guided → Collaborative → Supervised → Full
echo - **Universal LLM Integration**: Claude, GPT-4, Gemini, DeepSeek, Llama
echo - **Enterprise Features**: Security, compliance, governance, cost optimization  
echo - **Self-Optimization**: Continuous learning and improvement
echo - **27 Comprehensive Modules**: Complete development platform
echo - **Specialized Agents**: Expert personas for different roles
echo.
echo ---
echo.
echo *This file ensures Claude Code can always reference the BMAD system capabilities*
) > CLAUDE.md

rem Create project-specific BMAD configuration
echo ⚙️ Creating project configuration...
(
echo # Enhanced BMAD System Project Configuration
echo bmad_config:
echo   version: "1.0.0"
echo   installation_date: "%date% %time%"
echo   project_type: "general"  # Options: web_application, mobile_app, enterprise, scientific, gaming
echo   autonomy_level: "collaborative"  # Options: guided, collaborative, supervised, full
echo   
echo   optimization_focus:
echo     - "quality"
echo     - "maintainability" 
echo     - "performance"
echo   
echo   learning:
echo     enabled: true
echo     adapt_to_style: true
echo     remember_preferences: true
echo   
echo   features:
echo     code_analysis: true
echo     automated_testing: true
echo     performance_monitoring: false
echo     security_scanning: false
echo     cost_optimization: false
echo     
echo   constraints:
echo     no_production_changes: true
echo     require_review: false
echo     max_autonomy: "supervised"
echo.
echo   agents:
echo     preferred_personas:
echo       - "architect"     # System design and architecture
echo       - "dev.ide"       # IDE-focused development
echo       - "analyst"       # Analysis and insights
echo     
echo     available_tasks:
echo       - "create-architecture"
echo       - "create-frontend-architecture" 
echo       - "review-infrastructure"
echo       - "advanced-elicitation"
echo.
echo # Customize this configuration for your specific project needs
echo # See .bmad/bmad-agent/ directory for available personas and tasks
) > .bmad\project-config.yml

rem Update .gitignore to optionally exclude BMAD
if exist .gitignore (
    findstr /C:".bmad/" .gitignore >nul 2>&1
    if errorlevel 1 (
        echo. >> .gitignore
        echo # Enhanced BMAD System ^(uncomment to exclude from git^) >> .gitignore
        echo #.bmad/ >> .gitignore
        echo 📝 Added optional .bmad/ entry to .gitignore
    )
) else (
    echo # Enhanced BMAD System ^(uncomment to exclude from git^) > .gitignore
    echo #.bmad/ >> .gitignore
    echo 📝 Created .gitignore with optional .bmad/ entry
)

rem Verify installation
echo.
echo 🔍 Verifying installation...

set "INSTALLATION_VALID=true"

if not exist .bmad (
    echo ❌ .bmad directory not created
    set "INSTALLATION_VALID=false"
)

if not exist .bmad\bmad-agent (
    echo ❌ BMAD agents not installed
    set "INSTALLATION_VALID=false"
)

if not exist CLAUDE.md (
    echo ❌ CLAUDE.md reference file not created
    set "INSTALLATION_VALID=false"
)

if "%INSTALLATION_VALID%" == "true" (
    echo ✅ Enhanced BMAD System installed successfully!
    echo.
    echo 📁 Installation summary:
    echo    📚 BMAD System: .bmad/ ^(documentation and modules^)
    echo    🤖 BMAD Agents: .bmad/bmad-agent/ ^(personas and tasks^)
    echo    📝 Claude Reference: CLAUDE.md ^(persistent reference^)
    echo    ⚙️ Configuration: .bmad/project-config.yml
    echo.
    echo 📊 Files installed:
    
    rem Count files
    for /f %%i in ('dir .bmad\*.md /s /b 2^>nul ^| find /c /v ""') do set MD_COUNT=%%i
    for /f %%i in ('dir .bmad\*.yml .bmad\*.yaml /s /b 2^>nul ^| find /c /v ""') do set YML_COUNT=%%i
    echo    Documentation files: %MD_COUNT%
    echo    Configuration files: %YML_COUNT%
    
    echo.
    echo 🎯 Next steps:
    echo 1. Open Claude Code in this project directory
    echo 2. Reference CLAUDE.md for the startup prompt
    echo 3. Start with: 'I have Enhanced BMAD System in .bmad/ directory'
    echo 4. Let Claude read the documentation and begin BMAD-powered development
    echo.
    echo 📚 Key files to mention to Claude:
    echo    - .bmad/README.md ^(system overview^)
    if exist .bmad\QUICK_START_CLAUDE_CODE.md (
        echo    - .bmad/QUICK_START_CLAUDE_CODE.md ^(setup guide^)
    )
    echo    - .bmad/bmad-agent/ ^(specialized agents^)
    echo    - CLAUDE.md ^(reference guide^)
    echo.
    echo 🆘 If you encounter issues:
    echo    - Make sure you're in your target project directory
    echo    - Check file permissions if copying failed
    echo    - Run script from the BMAD-METHOD repository root
    echo    - Use the manual installation commands shown above if needed
) else (
    echo ❌ Installation completed with errors. Manual steps:
    echo.
    echo 📝 Manual installation commands:
    echo    mkdir .bmad
    echo    xcopy "%SCRIPT_DIR%\bmad-agent" .bmad\bmad-agent\ /E /I /Y
    if exist "%SCRIPT_DIR%\bmad-system" (
        echo    xcopy "%SCRIPT_DIR%\bmad-system" .bmad\ /E /Y
    )
    echo.
    echo 🔍 Check:
    echo    1. You have write permissions in current directory
    echo    2. Source files exist in BMAD repository
    echo    3. No conflicts with existing .bmad directory
    pause
    exit /b 1
)

echo.
echo 🚀 Enhanced BMAD System ready!
echo    Welcome to the future of AI-powered development! 🎉
echo.
pause