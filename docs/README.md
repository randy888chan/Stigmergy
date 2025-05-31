# BMad Method Documentation

This directory contains the source files for the BMad Method Documentation website, built with MkDocs and the Material theme.

## Quick Start

### Local Development

1. **Install MkDocs and dependencies**:
   ```bash
   pip install mkdocs-material mkdocs-minify-plugin PyYAML requests
   ```

2. **Serve documentation locally**:
   ```bash
   mkdocs serve
   ```

3. **View documentation**: Open [http://localhost:8000](http://localhost:8000)

### Build Static Site

```bash
mkdocs build
```

The built site will be in the `site/` directory.

## Documentation Structure

```
docs/
├── index.md                    # Homepage
├── getting-started/            # New user onboarding
│   ├── index.md               # Getting started overview
│   ├── installation.md        # Installation guide
│   ├── verification.md        # Setup verification
│   └── first-project.md       # First project tutorial
├── commands/                   # Command reference
│   ├── index.md               # Commands overview
│   ├── orchestrator.md        # Core orchestrator commands
│   ├── agents.md              # Agent-specific commands
│   └── quick-reference.md     # Auto-generated command reference
├── workflows/                  # Workflows and best practices
│   ├── index.md               # Workflow overview
│   ├── mvp-development.md     # Complete MVP example
│   ├── persona-switching.md   # Using different personas
│   └── best-practices.md      # Quality and methodology
├── examples/                   # Real-world examples
│   ├── index.md               # Examples overview
│   ├── web-app.md             # Building a web application
│   ├── api-service.md         # Creating an API service
│   └── troubleshooting.md     # Common issues and solutions
├── reference/                  # Technical reference
│   ├── index.md               # Reference overview
│   ├── personas.md            # Auto-generated personas reference
│   ├── tasks.md               # Available tasks
│   ├── quality-framework.md   # Quality standards
│   └── memory-system.md       # Memory and learning features
└── assets/                     # Images, videos, and other assets
    ├── images/
    └── videos/
```

## Automation Scripts

### Command Synchronization

Automatically generates command reference documentation from the BMad system:

```bash
python scripts/sync-commands.py
```

**Generated files:**
- `docs/commands/quick-reference.md` - Complete command reference
- `docs/reference/personas.md` - Available agents and their tasks

### Content Validation

Validates documentation for common issues:

```bash
python scripts/validate-content.py
```

**Checks performed:**
- Markdown syntax validation
- Internal link validation
- External link validation (when not in CI)
- Content standards compliance
- MkDocs configuration validation

## Writing Guidelines

### Content Standards

- **Scannable**: Use headings, bullets, and clear structure
- **Action-oriented**: Start with what users can do
- **Examples-first**: Show, then explain
- **Progressive detail**: Essential info first, details via links
- **Mobile-friendly**: Short paragraphs, clear formatting

### Markdown Conventions

- **Headings**: Use proper hierarchy (H1 → H2 → H3)
- **Code blocks**: Always specify language (```bash, ```python, etc.)
- **Links**: Use descriptive text, validate all links
- **Line length**: Keep lines under 120 characters for readability
- **Images**: Include alt text, optimize for web

### File Naming

- Use lowercase with hyphens: `getting-started.md`
- Be descriptive: `mvp-development.md` not `example1.md`
- Match URL structure: `workflows/best-practices.md` → `/workflows/best-practices/`

## Contributing

### Adding New Content

1. **Create the markdown file** in the appropriate directory
2. **Add to navigation** in `mkdocs.yml`
3. **Run validation** to check for issues:
   ```bash
   python scripts/validate-content.py
   ```
4. **Test locally** with `mkdocs serve`
5. **Submit pull request**

### Updating Command Reference

Command references are auto-generated from the BMad system. To update:

1. **Modify source files** in `bmad-agent/` directory
2. **Run sync script**:
   ```bash
   python scripts/sync-commands.py
   ```
3. **Review generated files** and commit changes

### Content Review Process

1. **Validation**: All content must pass validation checks
2. **Testing**: Test all examples and installation steps
3. **Review**: Peer review for accuracy and clarity
4. **Deployment**: Automatic deployment via GitHub Actions

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

If needed, you can deploy manually:

```bash
mkdocs gh-deploy
```

### GitHub Actions

The repository includes GitHub Actions workflows for:

- **docs-deploy.yml**: Automatic deployment to GitHub Pages
- **docs-validate.yml**: Content validation on pull requests

## Troubleshooting

### Common Issues

**MkDocs won't start**:
```bash
pip install --upgrade mkdocs-material
```

**Validation errors**:
- Check the specific error message
- Run `python scripts/validate-content.py` for details
- Fix issues and re-validate

**Missing dependencies**:
```bash
pip install -r requirements.txt
```

**Build errors**:
- Check `mkdocs.yml` syntax
- Ensure all referenced files exist
- Run `mkdocs build --strict` for detailed errors

### Getting Help

1. Check existing [GitHub Issues](https://github.com/danielbentes/DMAD-METHOD/issues)
2. Review validation output for specific guidance
3. Test with a fresh MkDocs installation
4. Create a new issue with error details and system information

## Performance

The documentation is optimized for:

- **Load time**: <1 second for static content
- **Search**: <100ms response time (client-side)
- **Mobile**: Excellent performance on all devices
- **SEO**: Static HTML with proper metadata

## Architecture

- **Static site generator**: MkDocs with Material theme
- **Hosting**: GitHub Pages with global CDN
- **Search**: Client-side search with offline capability
- **Analytics**: Privacy-focused analytics (when configured)
- **Content**: Markdown files with front matter
- **Automation**: Python scripts for validation and sync

---

For more information about BMad Method, visit the [main documentation](index.md) or the [GitHub repository](https://github.com/danielbentes/DMAD-METHOD). 