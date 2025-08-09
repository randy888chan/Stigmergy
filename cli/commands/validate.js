import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

// Helper to get the core path, respecting test environments
function getCorePath(providedPath) {
  if (providedPath) return providedPath;
  if (global.StigmergyConfig && global.StigmergyConfig.core_path) {
    return global.StigmergyConfig.core_path;
  }
  return path.join(process.cwd(), ".stigmergy-core");
}

export async function validateAgents(providedCorePath) {
  console.log("Validating agent definitions...");

  const corePath = getCorePath(providedCorePath);
  const agentsDir = path.join(corePath, "agents");

  if (!fs.existsSync(agentsDir)) {
    return {
      success: false,
      error: "Agents directory not found",
    };
  }

  const agentFiles = await fs.readdir(agentsDir);
  let invalidAgents = 0;

  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;

    const content = await fs.readFile(path.join(agentsDir, file), "utf8");
    const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/);

    if (!yamlMatch) {
      console.error(`❌ ${file}: Missing YAML code block`);
      invalidAgents++;
      continue;
    }

    // Standardize on 'yaml' instead of 'yml'
    if (content.includes("```yml") && !content.includes("```yaml")) {
      console.warn(`⚠️ ${file}: Prefer 'yaml' over 'yml' in code block`);
    }

    try {
      const agentData = yaml.load(yamlMatch[1]);

      // Required fields validation
      const requiredFields = ["id", "name", "alias", "persona.role"];
      for (const field of requiredFields) {
        const [main, sub] = field.split(".");
        if (!agentData.agent[main] || (sub && !agentData.agent[main][sub])) {
          console.error(`❌ ${file}: Missing required field '${field}'`);
          invalidAgents++;
        }
      }

      // ID format validation
      if (agentData.agent.id && !/^[a-z0-9_-]+$/.test(agentData.agent.id)) {
        console.error(`❌ ${file}: Agent ID should be lowercase with hyphens/underscores only`);
        invalidAgents++;
      }

      // Alias format validation
      if (agentData.agent.alias && !agentData.agent.alias.startsWith("@")) {
        console.warn(`⚠️ ${file}: Agent alias should start with '@'`);
      }
    } catch (e) {
      console.error(`❌ ${file}: Invalid YAML - ${e.message}`);
      invalidAgents++;
    }
  }

  if (invalidAgents > 0) {
    return {
      success: false,
      error: `${invalidAgents} agent definition(s) failed validation`,
    };
  }

  console.log(" -> All agent definitions validated successfully");
  return { success: true };
}
