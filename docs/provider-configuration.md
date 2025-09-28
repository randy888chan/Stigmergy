# LLM Provider Configuration Guide

This guide helps you configure different AI providers for Stigmergy based on your needs and preferences.

## Quick Setup Options

### Option 1: Google Gemini (Recommended for Beginners)
```bash
# In your .env file:
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Override default models
REASONING_MODEL=gemini-2.0-flash-thinking-exp
EXECUTION_MODEL=gemini-1.5-flash
UTILITY_MODEL=gemini-1.5-flash-8b
```

### Option 2: OpenRouter (Access Multiple Providers)
```bash
# In your .env file:
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Switch providers to OpenRouter
REASONING_PROVIDER=openrouter
EXECUTION_PROVIDER=openrouter
UTILITY_PROVIDER=openrouter

# Optional: Specify models
OPENROUTER_REASONING_MODEL=deepseek/deepseek-chat
OPENROUTER_EXECUTION_MODEL=anthropic/claude-3.5-sonnet
```

### Option 3: Direct Provider APIs
```bash
# DeepSeek (Cost-effective)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Kimi/Moonshot (Long context)
KIMI_API_KEY=your_kimi_api_key_here
KIMI_BASE_URL=https://api.moonshot.cn/v1

# Mistral (Multilingual)
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_BASE_URL=https://api.mistral.ai/v1

# Anthropic (Safety-focused)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com

# OpenAI (Latest models)
OPENAI_API_KEY=your_openai_api_key_here
```

## Provider Recommendations

### For Different Use Cases

| Use Case | Recommended Provider | Why |
|----------|---------------------|-----|
| **Beginners** | Google Gemini | Easy setup, good performance, reasonable pricing |
| **Cost-sensitive** | DeepSeek | Most cost-effective, especially for Chinese content |
| **Long documents** | Kimi/Moonshot | 32K+ context window |
| **Multilingual** | Mistral | European provider, excellent multilingual support |
| **Safety-critical** | Anthropic Claude | Best safety alignment |
| **Latest features** | OpenAI | Cutting-edge models like o1-preview |
| **Variety/Fallback** | OpenRouter | Access to many providers through one API |

### For Different Regions

| Region | Recommended | Backup |
|--------|------------|--------|
| **Global** | Google Gemini | OpenRouter |
| **China** | DeepSeek, Kimi | OpenRouter |
| **Europe** | Mistral | Anthropic |
| **USA** | OpenAI | Google Gemini |

## Using Specific Tiers

You can use dedicated provider tiers for specific tasks:

```bash
# Use DeepSeek for reasoning tasks
REASONING_PROVIDER=deepseek

# Use Anthropic for execution tasks  
EXECUTION_PROVIDER=anthropic

# Use Google for utility tasks
UTILITY_PROVIDER=google
```

Or use pre-configured tiers:

```javascript
// In your code:
const reasoningModel = getModelForTier('deepseek_reasoning');
const executionModel = getModelForTier('anthropic_reasoning'); 
const utilityModel = getModelForTier('utility_tier');
```

## Mixed Provider Setup

You can mix different providers for different tasks:

```bash
# Use Google for planning (reliable)
REASONING_PROVIDER=google
REASONING_MODEL=gemini-2.0-flash-thinking-exp

# Use DeepSeek for execution (cost-effective)
EXECUTION_PROVIDER=deepseek  
EXECUTION_MODEL=deepseek-chat

# Use fast local model for utilities
UTILITY_PROVIDER=groq
UTILITY_MODEL=llama-3.2-3b-preview
```

## Getting API Keys

### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key to your `.env` file

### OpenRouter
1. Go to https://openrouter.ai/keys
2. Sign up/log in
3. Create a new API key
4. Add credits to your account

### DeepSeek
1. Go to https://platform.deepseek.com/api_keys
2. Register account
3. Create API key
4. Add to your `.env` file

### Kimi/Moonshot
1. Go to https://platform.moonshot.cn/console/api-keys
2. Register (requires Chinese phone number)
3. Create API key
4. Top up account balance

### Mistral
1. Go to https://console.mistral.ai/api-keys/
2. Create account
3. Generate API key
4. Add payment method

### Anthropic
1. Go to https://console.anthropic.com/account/keys
2. Create account
3. Generate API key
4. Add credits

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create account
3. Generate API key
4. Add payment method

## Cost Optimization

Enable cost optimization features:

```bash
ENABLE_COST_OPTIMIZATION=true
PREFER_CHEAPER_MODELS=true
MAX_COST_PER_REQUEST=0.10
```

## Performance Monitoring

Track provider performance:

```bash
ENABLE_PERFORMANCE_MONITORING=true
MIN_SUCCESS_RATE=0.85
MAX_ERROR_RATE=0.15
```

## Troubleshooting

### Provider Not Working
1. Check API key is correct
2. Verify base URL if using custom endpoint
3. Check account has sufficient credits
4. Test with simple model first

### Slow Responses
1. Try a different provider
2. Use faster models (e.g., flash variants)
3. Enable cost optimization
4. Check network connectivity

### High Costs
1. Enable cost optimization
2. Use cheaper providers (DeepSeek, OpenRouter)
3. Set max cost per request limits
4. Monitor usage regularly

## Advanced Configuration

Create custom provider configurations:

```javascript
// In stigmergy.config.js
custom_provider: {
  provider: "custom",
  api_key_env: "CUSTOM_API_KEY",
  base_url_env: "CUSTOM_BASE_URL",
  model_name: "custom-model-name",
  capabilities: ["reasoning"],
  use_cases: ["specialized_tasks"]
}
```

## Support

For provider-specific issues, check:
- Provider documentation
- Provider status pages  
- Community forums
- Stigmergy GitHub issues

For configuration help:
- Run `bun run health-check`
- Check console logs
- Validate configuration with `bun run validate`