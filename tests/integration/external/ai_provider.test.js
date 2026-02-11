import { test, expect, describe } from 'bun:test';
import axios from 'axios';

const LIVE_TEST_TIMEOUT = 60000;

describe('External Service Health Check: AI Provider', () => {
  // RESTORED VARIABLES
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const credentialsArePresent = apiKey && apiKey !== 'mock-api-key';

  test.if(credentialsArePresent)('LIVE: should connect to OpenRouter/LLM and receive a valid model list', async () => {
    try {
      // Normalize URL (remove /chat/completions if present)
      const listUrl = baseURL.replace('/chat/completions', '') + '/models';

      const response = await axios.get(listUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      console.log(`\n[Live Health Check] Successfully connected to LLM Provider.`);
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`Failed to connect to AI Provider. Details: ${errorMessage}`);
    }
  }, LIVE_TEST_TIMEOUT);
});
