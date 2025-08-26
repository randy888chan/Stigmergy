import axios from 'axios';
import * as nativeResearch from './research.js';

const ARCHON_API_URL = 'http://localhost:8181/api';

/**
 * Checks if the Archon server is running and healthy.
 * @returns {Promise<{status: 'ok' | 'error', message: string}>}
 */
export async function healthCheck() {
  try {
    const response = await axios.get(`${ARCHON_API_URL}/health`, { timeout: 1500 });
    if (response.status === 200 && response.data.status === 'healthy') {
        return { status: 'ok', message: 'Connected to Archon server.' };
    }
    return { status: 'error', message: 'Archon server is unhealthy.' };
  } catch (error) {
    return { status: 'error', message: 'Archon server not found at localhost:8181.' };
  }
}

export async function query({ query }) {
  const health = await healthCheck();

  if (health.status === 'ok') {
    console.log("🚀 Archon server detected. Using advanced RAG for research.");
    try {
      const response = await axios.post(`${ARCHON_API_URL}/rag/query`, { query });
      return response.data;
    } catch (error) {
      console.error("Archon tool failed, falling back to native research:", error.message);
      return nativeResearch.deep_dive({ query });
    }
  } else {
    console.log("🔧 Archon server not detected. Using native research tool.");
    return nativeResearch.deep_dive({ query });
  }
}
