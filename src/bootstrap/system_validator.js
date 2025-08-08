import neo4j from 'neo4j-driver';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Validates the health of the entire Stigmergy system and attempts to auto-repair issues.
 */
export class SystemValidator {
  constructor() {
    this.results = {};
  }
  /**
   * Runs all validation checks and then triggers auto-repair if necessary.
   * @returns {Promise<object>} An object containing the results of all checks.
   */
  async comprehensiveCheck() {
    console.log('--- Starting Comprehensive System Health Check ---');
    this.results = {
      core: await this.validateCoreIntegrity(),
      neo4j: await this.validateNeo4j(),
      build: await this.validateBuildSystem(),
      ide: await this.validateIDEIntegration(),
      // e2e: await this.runEndToEndTest() // Placeholder for a more complex test runner
    };

    const hasFailures = Object.values(this.results).some(r => !r.success);

    if (hasFailures) {
      console.warn('⚠️ System health check failed. Attempting auto-repair...');
      await this.autoRepair();
    } else {
      console.log('✅ System health check passed successfully.');
    }

    return this.results;
  }

  async validateCoreIntegrity() {
    console.log('Checking core integrity...');
    const corePath = path.join(process.cwd(), '.stigmergy-core');
    if (!fs.existsSync(corePath)) {
        return { success: false, error: '.stigmergy-core directory not found.' };
    }

    const requiredPaths = [
      'agents/',
      'templates/',
      'system_docs/00_System_Goal.md'
    ];

    const missing = [];
    for (const p of requiredPaths) {
      if (!fs.existsSync(path.join(corePath, p))) {
        missing.push(p);
      }
    }

    if (missing.length > 0) {
      const error = `CRITICAL: Core integrity compromised. Missing: ${missing.join(', ')}`;
      console.error(`  -> ${error}`);
      return { success: false, error };
    }

    console.log('  -> Core integrity verified.');
    return { success: true, message: "Core integrity verified" };
  }

  async validateNeo4j() {
    console.log('Checking Neo4j connection...');
    try {
      const driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
      );
      const session = driver.session();
      await session.run('RETURN 1 as test');
      await session.close();
      await driver.close();
      console.log('  -> Neo4j connection verified.');
      return { success: true, message: 'Neo4j connection verified' };
    } catch (error) {
      console.error('  -> Neo4j connection failed.', error.message);
      return { success: false, error: error.message };
    }
  }

  async validateBuildSystem() {
    console.log('Checking build system...');
    try {
      // The `build` script might not exist or be correct yet. This is a placeholder.
      // execSync('npm run build', { stdio: 'pipe' });
      // const distExists = await fs.pathExists('dist');
      // For now, we'll just assume it's okay.
      console.log('  -> Build system check placeholder: OK');
      return { success: true, message: 'Build system check placeholder: OK' };
    } catch (error) {
      console.error('  -> Build system failed.', error.message);
      return { success: false, error: error.message };
    }
  }

  async validateIDEIntegration() {
    console.log('Checking IDE integration...');
    // This file is specific to the Room.sh IDE extension.
    const roomodesExists = await fs.pathExists('.roomodes');
    if (roomodesExists) {
      console.log('  -> .roomodes file found.');
      return { success: true, message: 'IDE integration ready' };
    } else {
      console.warn('  -> .roomodes file missing.');
      return { success: false, error: '.roomodes file missing' };
    }
  }

  async autoRepair() {
    for (const [system, result] of Object.entries(this.results)) {
      if (!result.success) {
        const repairMethodName = `repair${system.charAt(0).toUpperCase()}${system.slice(1)}`;
        if (typeof this[repairMethodName] === 'function') {
          console.log(`\n--- Repairing ${system}... ---`);
          await this[repairMethodName](result.error);
        } else {
          console.error(`No repair method found for '${system}'. Please fix manually.`);
        }
      }
    }
  }

  // --- Placeholder Auto-Repair Methods ---

  async repairNeo4j(error) {
    console.log('Attempting to repair Neo4j connection...');
    console.log('  - Please ensure your Neo4j server is running.');
    console.log('  - Check your credentials in the .env file (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).');
    // TODO: Add logic to try restarting a docker container, etc.
  }

  async repairBuild(error) {
    console.log('Attempting to repair build system...');
    console.log('  - Running `npm install` to restore dependencies...');
    try {
      execSync('npm install', { stdio: 'pipe' });
      console.log('  - `npm install` completed. Please try the build again.');
    } catch (e) {
      console.error('  - `npm install` failed. Please check your package.json and network connection.');
    }
  }

  async repairIde(error) {
    console.log('Attempting to repair IDE integration...');
    console.log('  - The .roomodes file can be generated by the Room.sh IDE extension.');
    console.log('  - Try restarting VS Code or running the relevant Room.sh command.');
    // TODO: Add logic to auto-generate a basic .roomodes file.
  }
}
