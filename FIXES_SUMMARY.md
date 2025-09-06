# Stigmergy Repository Fixes Summary

## Issue Fixed
The main issue was a `ReferenceError: __dirname is not defined` error when starting the Stigmergy engine. This occurred because the code was using ES Modules (ESM) but trying to use `__dirname`, which is not available in ESM by default.

## Root Cause Analysis
1. The package.json specifies `"type": "module"`, making it an ESM project
2. In ESM, `__dirname` and `__filename` are not automatically available
3. The engine/server.js file was using `__dirname` without defining it first
4. No explicit retry mechanisms were in place for handling LLM rate limits or transient errors

## Fixes Implemented

### 1. Fixed ESM __dirname Issue
**File:** [/Users/user/Documents/GitHub/Stigmergy/engine/server.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js)

Added proper ESM-compatible definitions for `__dirname` and `__filename`:
```javascript
import { fileURLToPath } from 'url';
import path from 'path';

// Define __dirname for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 2. Added Retry Mechanisms for LLM Calls
**Files:** 
- [/Users/user/Documents/GitHub/Stigmergy/engine/server.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js)
- [/Users/user/Documents/GitHub/Stigmergy/ai/providers.js](file:///Users/user/Documents/GitHub/Stigmergy/ai/providers.js)

#### In engine/server.js:
Added a retry utility function with exponential backoff:
```javascript
async function retryWithBackoff(fn, retries = 3, delay = 1000, backoffFactor = 2) {
  // Implementation with exponential backoff for handling rate limits
}
```

Integrated retry mechanism into the [triggerAgent](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js#L283-L341) method for both structured and text generation calls.

#### In ai/providers.js:
Added retry configuration and utility:
```javascript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};

async function retryWithExponentialBackoff(fn, retries = RETRY_CONFIG.maxRetries, baseDelay = RETRY_CONFIG.baseDelay) {
  // Implementation with exponential backoff for handling rate limits and transient errors
}
```

Wrapped model instances with retry logic to handle rate limits, timeouts, and network errors automatically.

### 3. Enhanced Error Handling
Improved error detection for retryable errors including:
- Rate limit errors (429, "rate limit", "quota")
- Network errors (timeouts, connection resets)
- Transient errors

## Testing
The fixes have been tested by running `npm run stigmergy:start` from the Stigmergy directory. The engine now starts successfully without the `__dirname` error.

## Additional Benefits
1. **Improved Reliability**: The retry mechanisms will help handle transient errors and rate limits from AI providers
2. **Better User Experience**: Users will experience fewer failures due to temporary issues
3. **Future-Proofing**: The code now properly handles ESM conventions

## Potential Issues Addressed
- Rate limiting from AI providers (OpenAI, Google, OpenRouter, etc.)
- Network timeouts and connection issues
- Transient server errors from AI provider APIs
- ESM compatibility issues in Node.js environments

## Files Modified
1. [/Users/user/Documents/GitHub/Stigmergy/engine/server.js](file:///Users/user/Documents/GitHub/Stigmergy/engine/server.js) - Fixed ESM compatibility and added retry mechanisms
2. [/Users/user/Documents/GitHub/Stigmergy/ai/providers.js](file:///Users/user/Documents/GitHub/Stigmergy/ai/providers.js) - Enhanced provider-level retry mechanisms