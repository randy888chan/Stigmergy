import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { OutputFormatter } from "../utils/output_formatter.js";

const WEB_BUNDLE_HEADER = `CRITICAL: You are an AI agent orchestrator...`; // Keeping this brief for clarity

function findAgentFile(corePath, agentId) {
    const agentsDir = path.join(corePath, "agents");
    const extensions = [".md", ".yml", ".yaml"];
    for (const ext of extensions) {
      const filePath = path.join(agentsDir, `${agentId}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
}

export default async function build() {
  try {
    OutputFormatter.section("Web Agent Bundle Build");
    OutputFormatter.step("Initializing build process...");

    const corePath = path.join(process.cwd(), ".stigmergy-core");
    const distPath = path.join(process.cwd(), "dist");
    await fs.ensureDir(distPath);

    const teamsDir = path.join(corePath, "agent-teams");
    OutputFormatter.info(`Scanning for agent teams in: ${teamsDir}`);

    if (!await fs.pathExists(teamsDir)) {
      OutputFormatter.error(`Agent teams directory not found at the expected path. Halting build.`);
      return false;
    }

    // THIS IS THE ROBUST FIX: Use fs.readdir instead of glob.
    const allFiles = await fs.readdir(teamsDir);
    const teamFiles = allFiles.filter(file => file.endsWith(".yml") || file.endsWith(".yaml"));

    if (teamFiles.length === 0) {
      OutputFormatter.warning(`No agent team configuration files (.yml or .yaml) found in ${teamsDir}. Nothing to build.`);
      return true; // Not an error, just nothing to do.
    }

    OutputFormatter.info(`Found ${teamFiles.length} agent team configuration(s): ${teamFiles.join(', ')}`);

    const buildResults = [];
    
    for (const teamFileName of teamFiles) {
      const teamFile = path.join(teamsDir, teamFileName);
      const teamName = path.basename(teamFile).replace(/\.ya?ml$/, "");
      OutputFormatter.step(`Processing team: ${teamName}`);
      
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      if (!teamData || !teamData.bundle || !teamData.bundle.agents) {
        OutputFormatter.warning(`Skipping ${teamFileName} because it's malformed or has no agents list.`);
        buildResults.push({ team: teamName, status: "skipped", reason: "Malformed or empty bundle" });
        continue;
      }

      const bundleConfig = teamData.bundle;
      let bundleContent = `# Web Agent Bundle: ${bundleConfig.name || teamName}

${WEB_BUNDLE_HEADER}

`;
      let agentCount = 0;

      for (const agentId of bundleConfig.agents) {
        const agentPath = findAgentFile(corePath, agentId);
        if (agentPath) {
          const content = await fs.readFile(agentPath, "utf8");
          bundleContent += `--- START AGENT: @${agentId} ---\n`;
          bundleContent += content.trim() + "\n";
          bundleContent += `--- END AGENT: @${agentId} ---\n\n`;
          agentCount++;
        } else {
          OutputFormatter.warning(`Agent definition not found for '${agentId}' in team '${teamName}', skipping.`);
        }
      }
      
      const outputPath = path.join(distPath, `${teamName}.txt`);
      await fs.writeFile(outputPath, bundleContent, "utf8");
      OutputFormatter.success(` -> Created web agent bundle: dist/${teamName}.txt (${agentCount} agents)`);
      
      buildResults.push({ 
        team: teamName, 
        status: "success", 
        agents: agentCount,
        outputFile: `dist/${teamName}.txt`
      });
    }

    OutputFormatter.summary({
      "Teams Processed": teamFiles.length,
      "Bundles Created": buildResults.filter(r => r.status === "success").length,
    }, "Build Summary");

    OutputFormatter.success("Build complete!");
    return true;
  } catch (error) {
    OutputFormatter.error(`Build failed with an unexpected error: ${error.message}`);
    console.error(error.stack); // Log the full stack for debugging
    return false;
  }
}

// This is the new, critical part that makes the script executable.
// It checks if the file is being run directly and, if so, calls the main function.
if (import.meta.main) {
  build();
}