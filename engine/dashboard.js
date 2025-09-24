import express from "express";
import * as stateManager from "./state_manager.js";
import path from "path";
import AgentPerformance from './agent_performance.js';
import { getCostTracking } from './llm_adapter.js';

// The __dirname and fileURLToPath combination caused issues in Jest's ESM environment.
// Using process.cwd() is a more robust way to get the project root.
const publicPath = path.join(process.cwd(), 'dashboard', 'public');
const router = express.Router();

router.get("/state", async (req, res) => {
  try {
    const state = await stateManager.getState();
    const performance = await AgentPerformance.getPerformanceInsights();
    res.json({ ...state, performance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/cost", (req, res) => {
  try {
    const costData = getCostTracking();
    res.json(costData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all routes except /state
router.use(express.static(publicPath));

// Serve the React app for the root route
router.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default router;