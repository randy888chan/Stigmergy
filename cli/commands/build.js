import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";

// Note: This build script is simplified for the purpose of fixing the immediate issue.
// It bundles all agents into a single JSON file.

async function buildAgents() {
  console.log("Build process started: Bundling agent definitions...");
  const projectRoot = process.cwd();
  const agentsDir = path.join(projectRoot, ".stigmergy-core", "agents");
  const outputDir = path.join(projectRoot, "dist");
  const outputPath = path.join(outputDir, "agents.json");

  let allAgents = [];

  try {
    const agentFiles = await glob(path.join(agentsDir, "*.md"));
    console.log(`Found ${agentFiles.length} agent files.`);

    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      let yamlContent = null;

      const mdMatch = content.match(/```yml\s*([\s\S]*?)\s*```/);
      if (mdMatch && mdMatch[1]) {
        yamlContent = mdMatch[1];
      } else {
        yamlContent = content;
      }

      if (yamlContent) {
        try {
          const agentData = yaml.load(yamlContent);
          if (agentData && agentData.agent) {
            allAgents.push(agentData.agent);
          }
        } catch (e) {
          console.warn(
            `-  Skipping file due to YAML parsing error in ${path.basename(file)}: ${e.message}`
          );
        }
      }
    }

    await fs.ensureDir(outputDir);
    await fs.writeJson(outputPath, allAgents, { spaces: 2 });

    console.log(`✅ Agent build complete. ${allAgents.length} agents bundled into ${outputPath}`);
    return true;
  } catch (error) {
    console.error("❌ An unexpected error occurred during the build process:");
    console.error(error);
    return false;
  }
}

// This structure allows the function to be imported and used by the CLI.
export { buildAgents };
