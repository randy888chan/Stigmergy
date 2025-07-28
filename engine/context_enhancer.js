import * as codeIntelligence from "../tools/code_intelligence.js";

function extractSymbolsFromTask(taskContent) {
  const symbolRegex = /`([A-Za-z0-9_.]+)`|\b([A-Z][a-zA-Z0-9_]+)\b|\b([a-z][a-zA-Z0-9_]+)\b/g;
  const symbols = new Set();
  let match;
  while ((match = symbolRegex.exec(taskContent)) !== null) {
    const symbol = match[1] || match[2] || match[3];
    if (symbol) {
      symbols.add(symbol);
    }
  }
  return Array.from(symbols);
}

async function getContextForSymbols(symbols) {
  if (symbols.length === 0) {
    return "No specific code symbols were identified in the task.";
  }
  const contextPromises = symbols.map(async (symbol) => {
    try {
      const definition = await codeIntelligence.getDefinition({ symbolName: symbol });
      const usages = await codeIntelligence.findUsages({ symbolName: symbol });
      let context = `--- Context for symbol: \`${symbol}\` ---\n`;
      if (definition && definition.definition) {
        context += `Definition found in ${definition.file}:\n\`\`\`${definition.language || "javascript"}\n${definition.definition}\n\`\`\`\n`;
      } else {
        context += "Definition not found in code graph.\n";
      }
      if (usages && usages.length > 0) {
        context += `Found ${usages.length} usage(s):\n`;
        usages.slice(0, 5).forEach((usage) => {
          context += `- Used in: \`${usage.user}\` (File: ${usage.file}, Line: ${usage.line})\n`;
        });
      } else {
        context += "No usages found in the code graph.\n";
      }
      return context;
    } catch (error) {
      console.error(`[ContextEnhancer] Error fetching context for symbol ${symbol}:`, error);
      return `--- Error retrieving context for symbol: \`${symbol}\` ---\n`;
    }
  });
  const contexts = await Promise.all(contextPromises);
  return contexts.join("\n");
}

export async function enhance(taskContent) {
  console.log("[ContextEnhancer] Analyzing task for code symbols...");
  const symbols = extractSymbolsFromTask(taskContent);
  if (symbols.length > 0) {
    console.log(`[ContextEnhancer] Found symbols: ${symbols.join(", ")}`);
    console.log("[ContextEnhancer] Retrieving context from code graph...");
    const dynamicContext = await getContextForSymbols(symbols);
    console.log("[ContextEnhancer] Context retrieval complete.");
    return `
--- DYNAMIC CODE GRAPH CONTEXT ---
This is the most up-to-date information about the existing codebase, retrieved in real-time.
Prioritize this context over any static documentation for implementation details.
${dynamicContext}
--- END DYNAMIC CODE GRAPH CONTEXT ---
    `;
  }
  return "";
}
