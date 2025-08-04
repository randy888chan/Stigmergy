import express from "express";
import * as stateManager from "./state_manager.js";
import path from "path";

const router = express.Router();

router.get("/state", async (req, res) => {
  try {
    const state = await stateManager.getState();

    const tasks = state.project_manifest?.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === "DONE" || t.status === "COMPLETED"
    ).length;

    res.json({
      simplified: {
        project: state.project_name,
        status: state.project_status,
        progress: `${completedTasks}/${totalTasks}`,
        current: state.current_task || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use(express.static(path.join(process.cwd(), "dashboard/public")));

export default router;
