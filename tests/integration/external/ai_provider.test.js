import { test, expect, describe } from 'bun:test';
import axios from 'axios';
import config from '../../../stigmergy.config.js';

const LIVE_TEST_TIMEOUT = 60000;

describe('External Service Health Check: AI Provider', () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL;
  const credentialsArePresent = apiKey && baseURL;

  test.if(credentialsArePresent)('LIVE: should connect to OpenRouter and receive a valid model list', async () => {
    try {
      const response = await axios.get(`${baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      // A successful connection to OpenRouter's base URL returns a list of available models.
      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.data.length).toBeGreaterThan(0);

      console.log(`\n[Live Health Check] Successfully connected to OpenRouter and found ${response.data.data.length} models.`);
    } catch (error) {
      // Provide a much more helpful error message
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`Failed to connect to OpenRouter. Please check your API key and network connection. Details: ${errorMessage}`);
    }
  }, LIVE_TEST_TIMEOUT);
});