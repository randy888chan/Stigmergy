const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// This tool is designed for deep scraping of a single URL.
// In a real implementation, you might integrate a service like Firecrawl.ai
// For now, we use a robust Cheerio implementation.

/**
 * Scrapes the primary textual content of a given URL, cleaning it for LLM consumption.
 * @param {object} args - The arguments object.
 * @param {string} args.url - The URL to scrape.
 * @returns {Promise<string>} The extracted and cleaned text content from the URL.
 */
async function scrapeUrl({ url }) {
  if (!url) {
    throw new Error("URL cannot be empty.");
  }
  console.log(`[Scraper Tool] Scraping URL: ${url}`);
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    
    // Remove non-content elements
    $('script, style, nav, footer, aside, header, form, iframe, noscript').remove();
    
    // Convert links and images to a markdown-like format for context
    $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        if (text && href) {
            $(elem).replaceWith(`[${text}](${href})`);
        }
    });

    // A simple text extraction strategy, trying to preserve some structure
    let bodyText = $('body').text();
    
    // Clean up whitespace
    bodyText = bodyText
        .replace(/\s\s+/g, ' ') // Collapse multiple spaces
        .replace(/(\n\s*){3,}/g, '\n\n') // Collapse multiple newlines
        .trim();
    
    // Return a significant chunk of text for analysis
    return bodyText.substring(0, 8000); 
  } catch (error) {
    console.error(`[Scraper Tool] Scraping error for ${url}:`, error.message);
    return `Error scraping URL: ${error.message}. The site may be protected, down, or require JavaScript to render.`;
  }
}

module.exports = {
  scrapeUrl,
};
