import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";

// Helper to get the core path, respecting test environments
function getCorePath(providedPath) {
  if (providedPath) return providedPath;
  if (global.StigmergyConfig && global.StigmergyConfig.core_path) {
    return global.StigmergyConfig.core_path;
  }
  return path.join(process.cwd(), ".stigmergy-core");
}

const agentSchema = z.object({
  agent: z
    .object({
      id: z.string().regex(/^[a-z0-9_-]+$/, {
        message:
          "Agent ID must be lowercase and contain only letters, numbers, hyphens, or underscores.",
      }),
      name: z.string(),
      alias: z.string().startsWith("@", { message: "Alias must start with @" }).optional(),
      persona: z
        .object({
          role: z.string(),
        })
        .passthrough(),
      tools: z.array(z.string()).optional(),
    })
    .passthrough(),
});

export async function validateAgents(providedCorePath) {
  console.log("Validating agent definitions...");

  const corePath = getCorePath(providedCorePath);
  const agentsDir = path.join(corePath, "agents");

  if (!fs.existsSync(agentsDir)) {
    // In test environments, the core path might be different.
    const testCorePath = path.join(process.cwd(), "tests", "fixtures", "test-core");
    if (fs.existsSync(path.join(testCorePath, "agents"))) {
      console.log("Falling back to test-core directory for validation.");
      return validateAgents(testCorePath);
    }
    return {
      success: false,
      error: `Agents directory not found in ${corePath} or ${testCorePath}`,
    };
  }

  const agentFiles = await fs.readdir(agentsDir);
  let invalidAgents = 0;
  const aliases = new Map();

  for (const file of agentFiles) {
    if (!file.endsWith(".md") && !file.endsWith(".yml") && !file.endsWith(".yaml")) {
      continue;
    }

    const content = await fs.readFile(path.join(agentsDir, file), "utf8");
    const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/);

    if (!yamlMatch) {
      console.error(`❌ ${file}: Missing YAML code block`);
      invalidAgents++;
      continue;
    }

    if (content.includes("```yml") && !content.includes("```yaml")) {
      console.warn(`⚠️ ${file}: Prefer 'yaml' over 'yml' in code block`);
    }

    try {
      const agentData = yaml.load(yamlMatch[1]);
      const result = agentSchema.safeParse(agentData);

      if (!result.success) {
        console.error(`❌ ${file}: Validation failed:`);
        result.error.errors.forEach((err) => {
          console.error(`  - Path: ${err.path.join(".")}, Message: ${err.message}`);
        });
        invalidAgents++;
        continue;
      }

      // Check for duplicate aliases
      if (result.data.agent.alias) {
        if (aliases.has(result.data.agent.alias)) {
          console.error(
            `❌ ${file}: Duplicate alias '${
              result.data.agent.alias
            }' (also used in ${aliases.get(result.data.agent.alias)})`
          );
          invalidAgents++;
        } else {
          aliases.set(result.data.agent.alias, file);
        }
      }
    } catch (e) {
      console.error(`❌ ${file}: Invalid YAML - ${e.message}`);
      invalidAgents++;
    }
  }

  if (invalidAgents > 0) {
    return {
      success: false,
      error: `${invalidAgents} agent definition(s) failed validation.`,
    };
  }

  console.log(" -> All agent definitions validated successfully");
  return { success: true };
}

async function main() {
  const result = await validateAgents();
  if (!result.success) {
    console.error(`Validation failed: ${result.error}`);
    process.exit(1);
  }
}

// If this script is run directly, execute the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
