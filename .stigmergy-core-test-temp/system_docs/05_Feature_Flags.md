# ⚙️ Stigmergy Feature Flags

## Purpose

Feature flags enable controlled activation of system capabilities based on project requirements and environment.

## Flag Structure

Flags follow a hierarchical naming convention:

```
features.[category].[feature]
```

## Core Feature Categories

### 1. autonomy

Controls the level of autonomous decision-making

| Flag                                    | Default | Description                                                          |
| --------------------------------------- | ------- | -------------------------------------------------------------------- |
| features.autonomy.dynamic_planning      | true    | Allows agents to propose new task sequences not in the original plan |
| features.autonomy.autonomous_handoff    | true    | Enables automatic task reassignment between agents                   |
| features.autonomy.continuous_replanning | true    | Allows system to adjust plans based on progress metrics              |

### 2. verification

Controls verification rigor and scope

| Flag                                | Default | Description                                       |
| ----------------------------------- | ------- | ------------------------------------------------- |
| features.verification.technical     | true    | Verifies code against technical metrics and tests |
| features.verification.functional    | true    | Verifies against user story acceptance criteria   |
| features.verification.architectural | true    | Verifies conformance to architectural blueprint   |
| features.verification.business      | true    | Verifies alignment with business value metrics    |

### 3. business

Controls business-related capabilities

| Flag                              | Default | Description                                         |
| --------------------------------- | ------- | --------------------------------------------------- |
| features.business.market_research | true    | Enables market and competitor research capabilities |
| features.business.valuation       | true    | Enables business valuation and ROI calculations     |
| features.business.user_centricity | true    | Enforces user-centric design principles             |

### 4. tools

Controls tool access permissions

| Flag                   | Default | Description                      |
| ---------------------- | ------- | -------------------------------- |
| features.tools.browser | true    | Grants web research capabilities |
| features.tools.command | true    | Grants shell command execution   |
| features.tools.edit    | true    | Grants file editing capabilities |
| features.tools.read    | true    | Grants file reading capabilities |

## Configuration Example

```yaml
features:
  autonomy:
    dynamic_planning: true
    autonomous_handoff: true
    continuous_replanning: true
  verification:
    technical: true
    functional: true
    architectural: true
    business: true
  business:
    market_research: true
    valuation: true
    user_centricity: true
  tools:
    browser: true
    command: true
    edit: true
    read: true
```

## Feature-Based Agent Activation

Agents are activated based on feature requirements:

- **Dispatcher**: Always active
- **Business Planner**: Requires `features.business.*`
- **UX Expert**: Requires `features.business.user_centricity`
- **Debugger**: Requires `features.verification.*`
- **Meta**: Requires `features.autonomy.*`

```

## Critical Features of These System Documents:

1. **Comprehensive System Documentation**: These files provide the complete system documentation needed for both humans and agents to understand the framework.

2. **AI-Verifiable Structure**: The state schema is designed to be programmatically verifiable, supporting your core goal.

3. **Feature Flag System**: The feature flags document enables controlled activation of capabilities based on project needs.

4. **Consistent with Agent Protocols**: All documents reinforce the protocols defined in your agent files.

5. **Resource Navigation Ready**: Documents follow the format required for inclusion in web UI prompts.
```
