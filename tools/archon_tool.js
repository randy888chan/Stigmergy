// In tools/archon_tool.js
import axios from "axios";
import * as nativeResearch from "./research.js";

const ARCHON_API_URL = "http://localhost:8181/api";

/**
 * Checks if the Archon server is running and healthy.
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    const response = await axios.get(`${ARCHON_API_URL}/health`, { timeout: 1000 });
    return response.status === 200 && response.data.status === "healthy";
  } catch (error) {
    return false;
  }
}

/**
 * Performs a query using Archon's RAG system if available,
 * otherwise falls back to the native research tool.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.query - The research query.
 * @returns {Promise<any>} The research results.
 */
export async function query({ query }) {
  const isArchonRunning = await healthCheck();

  if (isArchonRunning) {
    console.log("🚀 Archon server detected. Using advanced RAG for research.");
    try {
      const response = await axios.post(`${ARCHON_API_URL}/rag/query`, { query, match_count: 10 });
      // Format the response to be similar to what nativeResearch returns
      return {
        new_learnings: response.data.results.map((r) => r.content),
        sources: response.data.results.map((r) => r.url),
      };
    } catch (error) {
      console.error("Archon tool failed, falling back to native research:", error.message);
      return nativeResearch.deep_dive({ query });
    }
  } else {
    console.log("🔧 Archon server not detected. Using native research tool.");
    return nativeResearch.deep_dive({ query });
  }
}
