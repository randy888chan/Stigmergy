# Commit Message Convention

We follow a structured commit message format to maintain clarity and consistency across the project.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

## Scope

The scope could be anything specifying the place of the commit change. For example:

- **docs**: Documentation changes
- **commands**: Command system changes
- **personas**: Persona-related changes
- **workflows**: Workflow documentation changes
- **build**: Build system changes

## Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

## Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

## Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

## Examples

```
feat(commands): add new memory bootstrap command

Add /bootstrap-memory command to initialize memory for brownfield projects.
This enables better context understanding when starting work on existing codebases.

Closes #123
```

```
fix(docs): correct command references in workflow documentation

- Replace /patterns with /anti-pattern-check
- Replace /insights with /suggest  
- Add missing /udtm command documentation

BREAKING CHANGE: Several documented commands have been renamed or replaced.
Users should update their workflows to use the new command names.
```

```
docs(workflows): update persona selection guide

Improve decision tree and add new scenario mappings for better persona selection guidance.
``` 