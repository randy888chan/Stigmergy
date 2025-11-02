# Advanced Configuration

This document provides examples for configuring Stigmergy with alternative AI providers. These are optional configurations for advanced users who wish to use different models or services.

## Using OpenRouter

To use a model from [OpenRouter](https://openrouter.ai/), you can update your `.env.development` file with the following configuration. This example sets all tiers to use the same OpenRouter model, but you can mix and match providers as needed.

```env
# --- AI Provider Configuration ---
# Example for using OpenRouter.
REASONING_PROVIDER=openrouter
REASONING_MODEL=google/gemini-flash-1.5
STRATEGIC_PROVIDER=openrouter
STRATEGIC_MODEL=google/gemini-pro-1.5
EXECUTION_PROVIDER=openrouter
EXECUTION_MODEL=anthropic/claude-3-haiku
UTILITY_PROVIDER=openrouter
UTILITY_MODEL=anthropic/claude-3-haiku

# --- API Keys ---
# Required for the selected AI provider.
OPENROUTER_API_KEY=your_openrouter_api_key_here

# --- Neo4j Database ---
# Required for graph-based memory and code intelligence.
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# --- System Environment ---
NODE_ENV=development
```

Remember to update the `provider` and `model` names in `stigmergy.config.js` if you are adding a new provider.
