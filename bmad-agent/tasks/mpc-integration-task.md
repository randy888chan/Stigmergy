# Task: MPC Integration

## Description
Inform agents about available Machine-Powered Capabilities (MPCs) and how to use them effectively for their specific role.

## Input Required
- Current agent persona name/role
- MPC configuration data

## Steps

1. **Load MPC Configuration**
   - Read MPC capabilities configuration from `config/mpc-capabilities.yml`
   - Filter capabilities relevant to the current agent persona
   - Check which MPCs are enabled for the project

2. **Present Available Capabilities**
   - Generate a concise list of available MPCs for the current agent
   - Include command syntax and best use cases
   - Provide specific examples of effective usage
   - Sort capabilities by relevance to current agent's role

3. **Suggest Integration Points**
   - Identify appropriate points in the agent's workflow to utilize MPCs
   - For research-focused agents (Analyst), emphasize search capabilities
   - For development agents, emphasize code search and documentation tools
   - For design agents, highlight visualization and mockup tools
   - For data-focused agents, highlight data analysis tools

4. **Document Usage Guidelines**
   - Explain when to use each MPC (and when not to)
   - Provide tips for crafting effective queries
   - Outline how to incorporate MPC results into agent outputs
   - Describe how to cite or reference MPC-sourced information

5. **Add to Knowledge Base**
   - Update `.ai/project-context.md` with MPC availability information
   - Add relevant MPCs to agent customization strings
   - Document available MPCs in the knowledge map

## Output
A comprehensive MPC integration report with:
- List of available MPCs for the current agent
- Command syntax and examples
- Recommended integration points in workflows
- Best practices for MPC utilization
- Updates to knowledge base files

## Example Output Format
```
## Available Machine-Powered Capabilities for [Agent Role]

### 1. [MPC Name] (*[command])
   - [Brief description]
   - **Ideal for:** [Use case 1], [Use case 2]
   - **Example:** "*[command] [sample query]"
   - **When to use:** [Specific situation where this MPC is most valuable]

### 2. [MPC Name] (*[command])
   - [Brief description]
   - **Ideal for:** [Use case 1], [Use case 2]
   - **Example:** "*[command] [sample query]"
   - **When to use:** [Specific situation where this MPC is most valuable]

## Recommended Integration Points

- During [specific phase/task], use [MPC] to [achieve specific outcome]
- When creating [specific artifact], leverage [MPC] for [specific purpose]
```

## Validation Criteria
- MPC information is relevant to the agent's role
- Command syntax is clear and accurate
- Examples are realistic and helpful
- Integration points align with the agent's workflow
- Knowledge base updates are consistent with the rest of the project