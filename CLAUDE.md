# CLAUDE.md - BMAD-METHOD Agent Guidelines

## Build Commands
- Build web agent: `node build-web-agent.js`
- Run tests: No automated testing suite identified
- Lint: No automated linting identified

## Code Style Guidelines

### File Structure
- All BMAD agent files located in `bmad-agent/` directory
- Follow established folder organization (personas/, tasks/, templates/, etc.)
- Web build outputs to `build/` directory

### JavaScript Conventions
- Use Node.js file system and path modules for file operations
- Error handling: Detailed error messages with process exit on critical failures
- Use try/catch blocks for error-prone operations

### Markdown Conventions
- Template files use descriptive headers and consistent structure
- Use mermaid diagrams in ```mermaid blocks
- Code snippets in ```language blocks
- Tables using proper markdown syntax
- Always quote complex labels in Mermaid diagrams

### Naming Conventions
- Files: kebab-case.md
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE

### Documentation
- Update relevant README.md files when making significant changes
- Follow existing comment and documentation styles