const codeGraph = require('../tools/code_graph');

/**
 * Analyzes a task to extract key symbols (class names, function names, etc.).
 * @param {string} taskContent - The content of the current task or story.
 * @returns {string[]} A list of potential code symbols.
 */
function extractSymbolsFromTask(taskContent) {
  // This regex finds symbols enclosed in backticks, a common markdown convention.
  const symbolRegex = /`([A-Za-z0-9_.]+)`/g;
  const symbols = new Set();
  let match;
  while ((match = symbolRegex.exec(taskContent)) !== null) {
    symbols.add(match[1]);
  }
  return Array.from(symbols);
}

/**
 * Retrieves relevant context from the code graph for a given set of symbols.
 * @param {string[]} symbols - An array of code symbols to look up.
 * @returns {Promise<string>} A formatted string of context for the LLM prompt.
 */
async function getContextForSymbols(symbols) {
  if (symbols.length === 0) {
    return 'No specific code symbols were identified in the task.';
  }

  const contextPromises = symbols.map(async (symbol) => {
    try {
      const definition = await codeGraph.getDefinition({ symbolName: symbol });
      const usages = await codeGraph.findUsages({ symbolName: symbol });

      let context = `--- Context for symbol: \`${symbol}\` ---\n`;
      if (definition.length > 0) {
        context += `Definition: ${JSON.stringify(definition[0])}\n`;
      } else {
        context += 'Definition not found in code graph.\n';
      }

      if (usages.length > 0) {
        context += `Found ${usages.length} usage(s):\n`;
        usages.slice(0, 5).forEach((usage) => { // Limit usages to avoid excessive context
          context += `- Used in: \`${usage.user}\` (Relationship: ${usage.relationship})\n`;
        });
      } else {
        context += 'No usages found in the code graph.\n';
      }
      return context;
    } catch (error) {
      console.error(`[ContextEnhancer] Error fetching context for symbol ${symbol}:`, error);
      return `--- Error retrieving context for symbol: \`${symbol}\` ---\n`;
    }
  });

  const contexts = await Promise.all(contextPromises);
  return contexts.join('\n');
}

/**
 * Main function to enhance an agent's context by querying the code graph.
 * @param {string} taskContent - The content of the agent's current task.
 * @returns {Promise<string>} The formatted, dynamic context from the code graph.
 */
async function enhance(taskContent) {
  console.log('[ContextEnhancer] Analyzing task for code symbols...');
  const symbols = extractSymbolsFromTask(taskContent);
  if (symbols.length > 0) {
    console.log(`[ContextEnhancer] Found symbols: ${symbols.join(', ')}`);
    console.log('[ContextEnhancer] Retrieving context from code graph...');
    const dynamicContext = await getContextForSymbols(symbols);
    console.log('[ContextEnhancer] Context retrieval complete.');
    return `
--- DYNAMIC CODE GRAPH CONTEXT ---
${dynamicContext}
--- END DYNAMIC CODE GRAPH CONTEXT ---
    `;
  }
  return ""; // Return empty string if no symbols are found
}

module.exports = {
  enhance,
};
