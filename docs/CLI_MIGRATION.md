# CLI to Chat Command Migration

| Legacy Command            | New Chat Command         | Notes                            |
| ------------------------- | ------------------------ | -------------------------------- |
| `npx stigmergy install`   | `@system setup project`  | Runs prechecks and configuration |
| `npm run stigmergy:start` | `@system start engine`   | Starts background server         |
| `npx stigmergy build`     | `@system compile agents` | Creates web bundles              |
| `npm run test:neo4j`      | `@system check database` | Tests Neo4j connection           |
| `npx stigmergy dashboard` | `@system show dashboard` | Opens monitoring UI              |

> **Deprecation Timeline:**
> Legacy commands will be removed in v3.0. Use chat commands for all operations.
