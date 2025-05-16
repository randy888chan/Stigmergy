// BETA-V3/build-agent-cfg.js
// This file contains the configuration for the build-bmad-orchestrator.js script.
// Paths are relative to the BETA-V3 directory (where this file and the script reside).

module.exports = {
  orchestrator_agent_prompt: "./bmad-agent/orchestrator-agent.md",
  agent_cfg: "./samples/orchestrator-agent-cfg.gemini.yaml", // Note: This referenced file is still YAML
  asset_root: "./bmad-agent/",
  build_dir: "./bmad-agent/build/",
};
