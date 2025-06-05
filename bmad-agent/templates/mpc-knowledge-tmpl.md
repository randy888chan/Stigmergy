# Machine-Powered Capabilities (MPCs)

## Available MPCs for This Project

### Search Capabilities
{LIST_SEARCH_MPCS}

### Code Search Capabilities
{LIST_CODE_SEARCH_MPCS}

### Data Analysis Capabilities
{LIST_DATA_ANALYSIS_MPCS}

### Image Generation Capabilities
{LIST_IMAGE_GENERATION_MPCS}

## Usage Guidelines

### Command Syntax
MPCs are invoked using the command format:
```
*[command] [query]
```

For example:
```
*perplexity latest developments in AI-driven development
*github best practices for React hooks
*firecrawl analyze customer churn patterns in subscription data
```

### Best Practices for MPC Usage

- **Be Specific:** Include precise terms and constraints in your queries
- **Context Matters:** Provide enough context for the MPC to understand your needs
- **Iterative Refinement:** Start broad, then refine based on initial results
- **Cite Sources:** Always reference information obtained through MPCs in your outputs
- **Validate Results:** Cross-check critical information from multiple sources

## Role-Specific MPC Integration

### Analyst
{ANALYST_MPC_GUIDELINES}

### Product Manager
{PM_MPC_GUIDELINES}

### Architect
{ARCHITECT_MPC_GUIDELINES}

### Developer
{DEVELOPER_MPC_GUIDELINES}

### Data Scientist
{DATA_SCIENTIST_MPC_GUIDELINES}

### QA Tester
{QA_MPC_GUIDELINES}

### DevOps Engineer
{DEVOPS_MPC_GUIDELINES}

## MPC Access Management

- **Adding New MPCs:** Update `config/mpc-capabilities.yml` with new capabilities
- **Configuring Access:** Modify the `agents` list for each MPC to control access
- **Documentation:** Add usage examples to this file when adding new MPCs