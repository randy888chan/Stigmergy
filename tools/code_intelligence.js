// This tool is the agent's interface to the Code Intelligence Service.
// It exposes powerful queries that agents can use to understand the codebase.
// The underlying service will be powered by the logic from `jonnoc-coderag`.

const codeIntelligenceService = require('../services/code_intelligence_service');

/**
 * Finds all usages of a specific symbol (function, class, variable, etc.).
 * @param {object} args - The arguments object.
 * @param {string} args.symbolName - The name of the symbol to find usages for.
 * @returns {Promise<Array<object>>} - A list of locations where the symbol is used.
 */
async function findUsages({ symbolName }) {
  // In the final implementation, this will call the service which runs a Cypher query.
  return codeIntelligenceService.findUsages({ symbolName });
}

/**
 * Retrieves the full definition of a symbol, including its methods and properties if it's a class.
 * @param {object} args - The arguments object.
 * @param {string} args.symbolName - The name of the symbol.
 * @returns {Promise<object>} - The detailed definition of the symbol.
 */
async function getDefinition({ symbolName }) {
  return codeIntelligenceService.getDefinition({ symbolName });
}

/**
 * Lists all modules that a specific file imports.
 * @param {object} args - The arguments object.
 * @param {string} args.filePath - The path to the file.
 * @returns {Promise<Array<string>>} - An array of imported module paths.
 */
async function getModuleDependencies({ filePath }) {
  // This would be another Cypher query to trace :IMPORTS relationships.
  console.log(`[CodeIntelligence] Getting module dependencies for: ${filePath}`);
  return ['/src/utils.js', '/src/config.js']; // Placeholder
}

/**
 * Calculates code quality metrics (CK metrics) for a given class.
 * This is invaluable for the @refactorer agent.
 * @param {object} args - The arguments object.
 * @param {string} args.className - The name of the class to analyze.
 * @returns {Promise<object>} - An object containing various code quality metrics.
 */
async function calculateCKMetrics({ className }) {
  console.log(`[CodeIntelligence] Calculating CK Metrics for class: ${className}`);
  // This will call a service method that runs the complex metric queries from coderag.
  return {
    wmc: 15, // Weighted Methods per Class
    dit: 3,  // Depth of Inheritance Tree
    noc: 2,  // Number of Children
    cbo: 8,  // Coupling Between Objects
    rfc: 25, // Response for Class
    lcom: 0.8 // Lack of Cohesion in Methods
  };
}

module.exports = {
  findUsages,
  getDefinition,
  getModuleDependencies,
  calculateCKMetrics,
};
