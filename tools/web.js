const axios = require('axios');
require('dotenv').config();

// --- Provider Implementations ---
async function searchWithSerper({ query }) {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) return "SERPER_API_KEY is not configured in .env";

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
    if (!apiKey) return "BRAVE_API_KEY is not configured in .env";
    // Placeholder for Brave Search API logic
    console.log(`[Web Tool] Searching with Brave for: "${query}"`);
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
        return await searchWithSerper({ query });
      default:
        return `Error: Unknown search provider '${provider}' configured in .env.`;
    }
  } catch(error) {
      console.error(`[Web Tool] Search error with ${provider}:`, error.message);
      return `Error performing search with ${provider}: ${error.message}. Check API key.`;
  }
}

module.exports = {
  search,
};
