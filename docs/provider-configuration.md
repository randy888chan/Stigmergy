# LLM Provider Configuration Guide

This guide explains how to configure different AI providers for Stigmergy. The system uses a flexible, tier-based configuration defined in `stigmergy.config.js` and controlled via environment variables in your `.env` file.

## Core Concept: Model Tiers

Stigmergy does not use a single model for all tasks. Instead, it defines different **"model tiers"** for different types of work (e.g., complex reasoning vs. simple code generation). This allows you to use powerful, expensive models for critical tasks and cheaper, faster models for routine ones.

These tiers are defined in the `model_tiers` object inside `stigmergy.config.js`.

### Example Tier Definition (`stigmergy.config.js`)

```javascript
// stigmergy.config.js
...
  model_tiers: {
    // For planning, analysis, complex tasks
    reasoning_tier: {
      provider: process.env.REASONING_PROVIDER || "openrouter",
      model_name: process.env.REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free",
      api_key_env: "OPENROUTER_API_KEY", // The .env variable for the API key
      base_url_env: "OPENROUTER_BASE_URL", // The .env variable for the base URL
      ...
    },
    // For code generation, documentation, testing
    execution_tier: {
      provider: process.env.EXECUTION_PROVIDER || "openrouter",
      model_name: process.env.EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free",
      ...
    },
    // ... other tiers
  }
...
```

## How to Configure Your Providers

Configuration is done in two steps:

1.  **Set your API keys in `.env`:** You need to provide the API key for the service you want to use.
2.  **(Optional) Override default models in `.env`:** You can specify which provider and model to use for the main tiers.

### Step 1: Add Your API Keys to `.env`

Copy the `.env.example` to `.env` if you haven't already. Then, add the API key for your chosen provider.

**Example for Google Gemini:**
```bash
# In your .env file:
GOOGLE_API_KEY=your_google_api_key_here
```

**Example for OpenRouter (to access many different models):**
```bash
# In your .env file:
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Step 2: (Optional) Select Providers and Models in `.env`

You can control the `reasoning_tier` and `execution_tier` by setting environment variables. If you don't set them, they will default to using OpenRouter.

**Example: Use Google Gemini for all main tiers:**
```bash
# In your .env file (in addition to your GOOGLE_API_KEY):
REASONING_PROVIDER=google
REASONING_MODEL=gemini-1.5-pro-latest

EXECUTION_PROVIDER=google
EXECUTION_MODEL=gemini-1.5-flash-latest
```

**Example: Use a specific model from OpenRouter:**
```bash
# In your .env file (in addition to your OPENROUTER_API_KEY):
REASONING_PROVIDER=openrouter
REASONING_MODEL=anthropic/claude-3.5-sonnet

EXECUTION_PROVIDER=openrouter
EXECUTION_MODEL=deepseek/deepseek-coder
```

## Getting API Keys

### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key to your `.env` file

### OpenRouter
1. Go to https://openrouter.ai/keys
2. Sign up/log in
3. Create a new API key and add it to `.env`.
4. **Important:** Also copy the "Base URL" from the OpenRouter docs into the `OPENROUTER_BASE_URL` variable in your `.env` file. It is typically `https://openrouter.ai/api/v1`.

### Other Providers (DeepSeek, Mistral, etc.)
The system is designed to work with any OpenAI-compatible API. To use another provider:
1. Get your API Key and the provider's Base URL.
2. Set them in your `.env` file (e.g., `MY_PROVIDER_API_KEY`, `MY_PROVIDER_BASE_URL`).
3. Modify `stigmergy.config.js` to add a new tier or update an existing one to use your new `api_key_env` and `base_url_env` variables.

## Troubleshooting

### Provider Not Working
1.  **Check API Key:** Ensure the key in your `.env` file is correct and has no extra characters.
2.  **Check Base URL:** For non-Google providers, ensure the `BASE_URL` in your `.env` file is correct.
3.  **Check Account Credit:** Make sure your provider account has sufficient funds or credits.
4.  **Check Model Name:** Ensure the model name you've specified (e.g., `anthropic/claude-3.5-sonnet`) is correct and available through your provider.