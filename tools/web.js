const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// NOTE: This uses a placeholder for the search API key. 
// For a real implementation, you would get a key from a service like Serper.dev or Brave Search.
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || 'your_serper_api_key';

/**
 * Performs a web search using an external API.
 * @param {object} args - The arguments object.
 * @param {string} args.query - The search query.
 * @returns {Promise<string>} A formatted string of search results.
 */
async function search({ query }) {
  if (!query) {
    throw new Error("Search query cannot be empty.");
  }
  console.log(`[Web Tool] Searching for: "${query}"`);
  try {
    const response = await axios.post('https://google.serper.dev/search', {
      q: query,
    }, {
      headers: {
        'X-API-KEY': SEARCH_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.organic) {
      const results = response.data.organic.slice(0, 5).map(item => 
        `- Title: ${item.title}\n  Link: ${item.link}\n  Snippet: ${item.snippet}`
      ).join('\n\n');
      return results;
    }
    return "No organic results found.";
  } catch (error) {
    console.error("[Web Tool] Search API error:", error.message);
    return `Error performing search: ${error.message}. Please check your API key and network connection.`;
  }
}

/**
 * Scrapes the textual content of a given URL.
 * @param {object} args - The arguments object.
 * @param {string} args.url - The URL to scrape.
 * @returns {Promise<string>} The extracted text content from the URL.
 */
async function scrape({ url }) {
  if (!url) {
    throw new Error("URL cannot be empty.");
  }
  console.log(`[Web Tool] Scraping URL: ${url}`);
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Use Cheerio to parse the HTML and extract text
    const $ = cheerio.load(data);
    // A simple text extraction strategy. Can be made more sophisticated.
    $('script, style, nav, footer, aside').remove();
    const textContent = $('body').text().replace(/\s\s+/g, ' ').trim();
    
    return textContent.substring(0, 4000); // Return a reasonable chunk of text
  } catch (error) {
    console.error(`[Web Tool] Scraping error for ${url}:`, error.message);
    return `Error scraping URL: ${error.message}. The site may be protected or down.`;
  }
}

module.exports = {
  search,
  scrape,
};
