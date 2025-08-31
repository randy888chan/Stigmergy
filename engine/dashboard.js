import express from "express";
import * as stateManager from "./state_manager.js";
import path from "path";
import { fileURLToPath } from 'url';
import AgentPerformance from './agent_performance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// Use an absolute path to the 'public' directory
const publicPath = path.join(__dirname, '..', 'dashboard', 'public');
router.use(express.static(publicPath));

export default router;
