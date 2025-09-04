import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment configuration with inheritance priority:
 * 1. Global Stigmergy installation .env (base configuration)
 * 2. Project-specific .env.stigmergy.example (if exists)
 * 3. Local project .env (project overrides)
 */
export function loadEnvironmentConfig() {
  const currentDir = process.cwd();
  const stigmergyRoot = path.resolve(__dirname, '..');
  
  console.log(`🔧 Loading environment configuration...`);
  console.log(`   Current directory: ${currentDir}`);
  console.log(`   Stigmergy root: ${stigmergyRoot}`);

  // Priority order for environment files (later files override earlier ones)
  const envFilesToLoad = [
    // 1. Global Stigmergy base configuration
    path.join(stigmergyRoot, '.env'),
    
    // 2. Project-specific Stigmergy configuration (if exists)
    path.join(currentDir, '.env.stigmergy.example'),
    
    // 3. Local project overrides
    path.join(currentDir, '.env'),
  ];

  let loadedCount = 0;
  let configSources = [];
  
  // Load in priority order
  for (const envFile of envFilesToLoad) {
    if (fs.existsSync(envFile)) {
      try {
        const result = dotenv.config({ path: envFile, override: true });
        if (!result.error) {
          const relativePath = path.relative(process.cwd(), envFile);
          console.log(`   ✅ Loaded: ${relativePath}`);
          configSources.push(relativePath);
          loadedCount++;
        }
      } catch (error) {
        const relativePath = path.relative(process.cwd(), envFile);
        console.log(`   ⚠️  Failed to load: ${relativePath} (${error.message})`);
      }
    }
  }

  if (loadedCount === 0) {
    console.log(`   ❌ No environment files found. Please run 'stigmergy install' to set up configuration.`);
    return {
      loaded: false,
      filesLoaded: 0,
      configSources: [],
      error: 'No configuration files found'
    };
  }

  console.log(`   📊 Total files loaded: ${loadedCount}`);
  
  // Validate critical environment variables
  const validation = validateCriticalVars();
  if (!validation.valid) {
    console.log(`   ⚠️  Configuration issues detected:`);
    validation.issues.forEach(issue => {
      console.log(`      • ${issue}`);
    });
  }

  return {
    loaded: loadedCount > 0,
    filesLoaded: loadedCount,
    configSources: configSources,
    workingDirectory: currentDir,
    stigmergyRoot: stigmergyRoot,
    validation: validation
  };
}

/**
 * Validate critical environment variables are available
 */
function validateCriticalVars() {
  const issues = [];
  
  // Check if we have at least one AI provider configured
  const hasGoogle = process.env.GOOGLE_API_KEY;
  const hasOpenRouter = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_BASE_URL;
  
  if (!hasGoogle && !hasOpenRouter) {
    issues.push('No AI provider configured (missing GOOGLE_API_KEY or OPENROUTER_API_KEY)');
  }
  
  // Check if provider configurations match the selected providers
  const reasoningProvider = process.env.REASONING_PROVIDER;
  const executionProvider = process.env.EXECUTION_PROVIDER;
  
  if (reasoningProvider === 'google' && !hasGoogle) {
    issues.push('REASONING_PROVIDER set to google but GOOGLE_API_KEY missing');
  }
  
  if (reasoningProvider === 'openrouter' && !hasOpenRouter) {
    issues.push('REASONING_PROVIDER set to openrouter but OPENROUTER_API_KEY/OPENROUTER_BASE_URL missing');
  }
  
  if (executionProvider === 'google' && !hasGoogle) {
    issues.push('EXECUTION_PROVIDER set to google but GOOGLE_API_KEY missing');
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
        "Copy .env.example to .env and configure your API keys",
        "Or run 'stigmergy install' to set up configuration"
      ]
    };
  }
  
  return { valid: true, missing: [] };
}

// Auto-load when this module is imported
const loadResult = loadEnvironmentConfig();

// Export the load result for debugging
export { loadResult };