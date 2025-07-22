const axios = require('axios');

// No longer loading dotenv here; the engine manages the environment.

async function searchWithSerper({ query }) {
  // MODIFIED: This check is now the trigger for the system's user input request.
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) {
     const err = new Error("The web search tool requires a Serper API Key (SEARCH_API_KEY).");
     err.name = "MissingApiKeyError";
     err.key_name = "SEARCH_API_KEY";
     throw err;
  }

  const response = await axios.post('https://google.serper.dev/search', { q: query }, {
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
  });

  if (response.data.organic?.length > 0) {
    return response.data.organic.slice(0, 5).map((item, index) => 
      `[${index + 1}] Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}`
    ).join('\n\n');
  }
  return `No organic results found for "${query}".`;
}
async function searchWithBrave({ query }) {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
       const err = new Error("The web search tool requires a Brave API Key (BRAVE_API_KEY).");
       err.name = "MissingApiKeyError";
       err.key_name = "BRAVE_API_KEY";
       throw err;
    }
    // ... implementation for Brave
    return `Brave search results for "${query}" (Not yet implemented).`;
}

// --- Main Tool Function ---
async function search({ query }) {
  const provider = process.env.SEARCH_PROVIDER?.toLowerCase() || 'serper';

  try {
    switch (provider) {
      case 'brave':
        return await searchWithBrave({ query });
      case 'serper':
      default:
        return await searchWithSerper({ query });
    }
  } catch(error) {
      // Re-throw our custom errors so the engine can catch them
      if(error.name === "MissingApiKeyError") {
          throw error;
      }
      console.error(`[Web Tool] Search error with ${provider}:`, error.message);
      return `Error performing search with ${provider}: ${error.message}.`;
  }
}

module.exports = {
  search,
};
