# IDE Auto-Execute Command Recommendations

This document provides recommendations for configuring auto-execute commands in your IDE for AI agent development, based on the Pheromind hybrid workflow.

## Balancing Empowerment and Safety

Giving agents the permission to execute commands automatically is like giving your virtual developers hands. However, this requires a careful balance between empowerment and safety.

## Recommended "Auto-Execute" Commands

This list is designed to be both powerful and safe for typical Next.js projects within the Pheromind workflow.

### Essential & Low-Risk Commands (Core Workflow)

These are necessary for the standard development loop.

- `npm install`: Allows the agent to install dependencies from `package.json`. Safe as you control `package.json`.
- `npm run lint`: Allows the agent to check its own code for style errors.
- `npm run test`: Allows the agent to run the test suite to verify its changes (core to TDD).
- `npm run build`: Allows the agent to check if the project compiles successfully.
- `ls`: Allows the agent to list files to understand project structure (read-only, safe).
- `cat`: Allows the agent to read file contents for context (read-only, safe).
- `mkdir`: Allows the agent to create new directories (e.g., for new components).
- `touch`: Allows the agent to create new, empty files.

### Git Commands (Enable with Understanding)

Necessary for agents to manage code; risk mitigated by feature branching.

- `git status`: Safe. Allows agent to see repository state.
- `git diff`: Safe. Allows agent to see its own changes.
- `git checkout`: Essential. Allows agent to switch/create branches.
- `git add`: Essential. Allows agent to stage changes.
- `git commit -m`: Essential. Allows agent to commit work.
- `git log`: Safe. Allows agent to review history.
- `git show`: Safe. Allows agent to inspect commits.

### Moderately Risky Commands (Use with Caution)

Can alter remote state or overwrite local changes. Enable when comfortable.

- `git pull`: Allows agent to pull latest changes. Can overwrite local changes if not handled carefully, but standard.
- `git push`: Allows agent to push completed feature branch. Desired in the Pheromind workflow for review/integration.
- `git merge`: May be needed by integrator agents. Powerful command requiring clear strategy.

## CRITICAL: Commands to FORBID

**Do NOT add these to the auto-execute list.** Giving an AI permission to run these autonomously is extremely risky.

- `git push --force` or `git push -f`: **NEVER.** Can overwrite remote history, deleting work.
- `git reset --hard`: Can permanently delete local changes/commits.
- `git clean -fdx`: Deletes all untracked files/directories. Could delete configs, `.env` files.
- `rm -rf`: **EXTREMELY DANGEROUS.** Could wipe out project or parts of home directory.

## Final Recommended `auto-execute` List

For a powerful yet safe setup, add these to your "Allowed Auto-Execute Commands":

```
npm install
npm run lint
npm run test
npm run build
npm run dev
ls
cat
mkdir
touch
git status
git diff
git checkout
git add
git commit -m
git log
git show
git pull
git push
```

This configuration empowers AI agents to handle the development micro-cycle autonomously (pull, branch, code, test, commit, push) while keeping you in strategic control.
