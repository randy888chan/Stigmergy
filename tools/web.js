const axios = require('axios');
require('dotenv').config();

// This tool is for quick, API-driven web search to get a list of results.
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const SEARCH_API_URL = 'https://google.serper.dev/search';

/**
 * Performs a web search using the Serper API.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search query.
 * @returns {Promise<string>} A formatted string of the top search results.
 */
async function search({ query }) {
  if (!query) {
    throw new Error("Search query cannot be empty.");
  }
  if (!SEARCH_API_KEY) {
    return "SEARCH_API_KEY is not configured in the .env file. Web search is disabled.";
  }

  console.log(`[Web Tool] Searching for: "${query}"`);
  try {
    const response = await axios.post(SEARCH_API_URL, { q: query }, {
      headers: { 'X-API-KEY': SEARCH_API_KEY, 'Content-Type': 'application/json' }
    });

    if (response.data.organic && response.data.organic.length > 0) {
      const results = response.data.organic.slice(0, 5).map((item, index) => 
        `[${index + 1}] Title: ${item.title}\n    Link: ${item.link}\n    Snippet: ${item.snippet}`
      ).join('\n\n');
      return `Top 5 Search Results for "${query}":\n\n${results}`;
    }
    return `No organic results found for "${query}".`;
  } catch (error) {
    console.error("[Web Tool] Search API error:", error.message);
    if (error.response?.status === 403) {
        return "Error performing search: Invalid API Key for Serper.";
    }
    return `Error performing search: ${error.message}.`;
  }
}

module.exports = {
  search,
};
