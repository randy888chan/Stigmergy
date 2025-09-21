import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Loads environment variables from the correct .env file based on the NODE_ENV environment variable.
 *
 * - If NODE_ENV is 'production', it loads '.env.production'.
 * - Otherwise, it defaults to loading '.env.development'.
 *
 * This ensures that the application uses the appropriate configuration for the environment it's running in.
 */
export function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFileName = nodeEnv === 'production' ? '.env.production' : '.env.development';
  const envFilePath = path.resolve(process.cwd(), envFileName);

  console.log(`🔧 Loading environment configuration for: ${nodeEnv}`);

  if (!fs.existsSync(envFilePath)) {
    console.log(`   ❌ Environment file not found: ${envFileName}`);
    console.log(`   Please ensure ${envFileName} exists in the project root.`);
    return {
      loaded: false,
      filesLoaded: 0,
      error: `Configuration file not found: ${envFileName}`,
    };
  }

  try {
    dotenv.config({ path: envFilePath, override: true });
    console.log(`   ✅ Loaded: ${envFileName}`);

    // Set NODE_ENV in process.env if not already set
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = nodeEnv;
    }

  } catch (error) {
    console.log(`   ⚠️  Failed to load: ${envFileName} (${error.message})`);
    return {
      loaded: false,
      filesLoaded: 0,
      error: `Failed to load ${envFileName}`,
    };
  }

  // Validate critical environment variables
  const validation = validateCriticalVars();
  if (!validation.valid) {
    console.log(`   ⚠️  Configuration issues detected:`);
    validation.issues.forEach(issue => {
      console.log(`      • ${issue}`);
    });
  }

  return {
    loaded: true,
    filesLoaded: 1,
    configSources: [envFileName],
    validation: validation,
  };
}

/**
 * Validate critical environment variables are available
 */
function validateCriticalVars() {
  const issues = [];
  
  // Check if we have at least one AI provider configured
  const hasGoogle = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here' && process.env.GOOGLE_API_KEY !== '${GOOGLE_API_KEY}';
  const hasOpenRouter = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_BASE_URL;
  
  if (!hasGoogle && !hasOpenRouter) {
    issues.push('No AI provider configured (missing GOOGLE_API_KEY or OPENROUTER_API_KEY)');
  }
  
  // Check if provider configurations match the selected providers
  const reasoningProvider = process.env.REASONING_PROVIDER || 'google';
  const executionProvider = process.env.EXECUTION_PROVIDER || 'google';
  
  if (reasoningProvider === 'google' && !hasGoogle) {
    issues.push('REASONING_PROVIDER set to google but GOOGLE_API_KEY missing or invalid');
  }
  
  if (reasoningProvider === 'openrouter' && !hasOpenRouter) {
    issues.push('REASONING_PROVIDER set to openrouter but OPENROUTER_API_KEY/OPENROUTER_BASE_URL missing');
  }
  
  if (executionProvider === 'google' && !hasGoogle) {
    issues.push('EXECUTION_PROVIDER set to google but GOOGLE_API_KEY missing or invalid');
  }
  
  if (executionProvider === 'openrouter' && !hasOpenRouter) {
    issues.push('EXECUTION_PROVIDER set to openrouter but OPENROUTER_API_KEY/OPENROUTER_BASE_URL missing');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}


/**
 * Validate that required environment variables are available
 */
export function validateEnvironment(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return { 
      valid: false, 
      missing: missing,
      suggestions: [
        "Ensure your .env.development or .env.production file is correctly configured."
      ]
    };
  }
  
  return { valid: true, missing: [] };
}

// Auto-load when this module is imported
const loadResult = loadEnvironmentConfig();

// Export the load result for debugging
export { loadResult };