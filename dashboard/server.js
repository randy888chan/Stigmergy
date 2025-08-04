import express from "express";
import { stateManager } from "../engine/state_manager.js";
import path from "path";

const app = express();
const PORT = 8080;

app.get("/api/state", async (req, res) => {
  try {
    const state = await stateManager.getState();
    res.json({
      project: state.project_name,
      status: state.project_status,
      progress: `${state.completedTasks}/${state.totalTasks}`,
      artifacts: state.artifacts_created,
      lastUpdated: state.history[state.history.length - 1]?.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(process.cwd(), "dashboard/public")));

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});
