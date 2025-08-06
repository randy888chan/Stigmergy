import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";

// This allows us to get the path to the package's root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function install() {
  console.log("Stigmergy install process started...");
  const targetDir = process.cwd(); // This will be the tempDir when run by the test
  const sourceDir = path.resolve(__dirname, "../../.stigmergy-core");

  try {
    // 1. Copy the .stigmergy-core directory from the package to the target location.
    // This simulates a real package installation.
    const destStigmergyDir = path.join(targetDir, ".stigmergy-core");
    await fs.copy(sourceDir, destStigmergyDir);
    console.log(`Copied .stigmergy-core to ${targetDir}`);

    // 2. Generate the .roomodes file based on the agents that were just copied.
    const agentsDir = path.join(destStigmergyDir, "agents");
    const agentFiles = await glob(path.join(agentsDir, "*.md"));

    let agentsForRoomodes = [];
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
          if (agentData && agentData.agent && agentData.agent.id) {
            // The test expects an array of objects with an 'id' field.
            agentsForRoomodes.push({ id: agentData.agent.id });
          }
        } catch (e) {
          console.warn(
            `- Skipping file in install due to YAML parse error: ${path.basename(file)}`
          );
        }
      }
    }

    const roomodesPath = path.join(targetDir, ".roomodes");
    await fs.writeJson(roomodesPath, agentsForRoomodes, { spaces: 2 });

    console.log(
      `✅ Install complete. .roomodes file created with ${agentsForRoomodes.length} agents.`
    );
    return true;
  } catch (error) {
    console.error("❌ An unexpected error occurred during the install process:");
    console.error(error);
    return false;
  }
}

export { install };
