/**
 * Modular agent loader with feature-based activation
 */

const fs = require("fs-extra");
const path = require("path");
const config = require("../stigmergy.config.js");

class AgentLoader {
  /**
   * Load agents based on feature configuration
   */
  async loadAgents() {
    const manifestPath = path.join(
      process.cwd(),
      ".stigmergy-core",
      "system_docs",
      "02_Agent_Manifest.md"
    );

    // Read and parse the manifest
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const yamlMatch = manifestContent.match(/```(?:yaml|yml)([\s\S]*?)\s*```/);

    if (!yamlMatch) {
      throw new Error("Agent manifest YAML block not found");
    }

    const manifest = YAML.parse(yamlMatch[1]);
    const activeAgents = [];

    // Filter agents based on feature configuration
    for (const agent of manifest) {
      if (this._isAgentActive(agent)) {
        activeAgents.push(agent);
      }
    }

    return activeAgents;
  }

  /**
   * Determine if an agent should be active based on feature flags
   */
  _isAgentActive(agent) {
    // Always include core system agents
    if (agent.id === "system" || agent.id === "dispatcher") {
      return true;
    }

    // Check feature requirements
    if (agent.requiredFeatures) {
      return agent.requiredFeatures.every((feature) => this._checkFeature(feature));
    }

    // Default to active if no feature requirements
    return true;
  }

  /**
   * Check if a feature is enabled
   */
  _checkFeature(feature) {
    // Handle nested feature paths (e.g., "businessTools.valuation")
    const parts = feature.split(".");
    let current = config.features;

    for (const part of parts) {
      if (typeof current[part] === "undefined") {
        return false;
      }
      current = current[part];
    }

    return !!current;
  }
}

module.exports = new AgentLoader();
