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

// Serve React app for all routes except /state
router.use(express.static(path.join(__dirname, '..', 'dashboard', 'public')));

// Serve the React app for the root route
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard', 'public', 'index.html'));
});

export default router;