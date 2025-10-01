import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`🔧 Loading environment configuration for: ${nodeEnv}`);

  // THIS IS THE CRITICAL FIX:
  // Create a fallback chain to find the correct .env file.
  const filesToTry = [
    `.env.${nodeEnv}`,     // e.g., .env.test or .env.production
    '.env.development',   // Fallback to development
    '.env'                // Final fallback to the base .env file
  ];

  let loadedFile = null;
  for (const file of filesToTry) {
    const envFilePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath, override: true });
      loadedFile = file;
      console.log(`   ✅ Loaded: ${loadedFile}`);
      break; // Stop after finding the first valid file
    }
  }

  if (!loadedFile) {
    console.log(`   ❌ Environment file not found. Looked for: ${filesToTry.join(', ')}`);
    return { loaded: false, filesLoaded: 0 };
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = nodeEnv;
  }

  return { loaded: true, filesLoaded: 1 };
}

// Auto-load when this module is imported
const loadResult = loadEnvironmentConfig();

export { loadResult };
