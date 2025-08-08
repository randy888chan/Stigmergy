import express from "express";
import * as stateManager from "./state_manager.js";
import path from "path";
import AgentPerformance from './agent_performance.js';

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

router.use(express.static(path.join(process.cwd(), "dashboard/public")));

export default router;
