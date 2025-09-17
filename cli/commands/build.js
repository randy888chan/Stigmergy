import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { glob } from "glob";
import { OutputFormatter } from "../utils/output_formatter.js";

const WEB_BUNDLE_HEADER = `CRITICAL: You are an AI agent orchestrator. The following content is a bundle of specialized AI agent personas. Your primary goal is to fulfill the user's request by adopting the MOST appropriate persona for each specific step of the task.

- **DO NOT** act as all agents at once.
- **ALWAYS** announce which agent persona you are adopting before you begin a task (e.g., "Now acting as @design-architect...").
- **USE** the protocols of your chosen agent persona to guide your response.
- **SWITCH** personas as the conversation requires. For example, after planning as @business_planner, you might switch to @design-architect for technical details.

When responding in a web IDE environment, provide conversational responses that are natural and easy to understand. Focus on clear communication and helpful guidance rather than strictly structured outputs.

Interpret this bundle to fulfill the user's high-level goal.\n\n`;


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
    const teamFiles = await glob(path.join(teamsDir, "*.{yml,yaml}"));

    OutputFormatter.info(`Found ${teamFiles.length} agent team configuration(s)`);

    const buildResults = [];
    
    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile).replace(/\.ya?ml$/, "");
      OutputFormatter.step(`Processing team: ${teamName}`);
      
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      if (!teamData || !teamData.bundle) {
        OutputFormatter.warning(`Skipping ${teamFile} because it has no root 'bundle' property.`);
        buildResults.push({ team: teamName, status: "skipped", reason: "No bundle property" });
        continue;
      }

      const bundleConfig = teamData.bundle;
      const bundleName = bundleConfig.name || teamName;
      
      let bundle = "";
      bundle += `# Web Agent Bundle: ${bundleName}\n\n`;
      bundle += WEB_BUNDLE_HEADER;

      let agentCount = 0;
      for (const agentId of bundleConfig.agents) {
        const agentPath = findAgentFile(corePath, agentId);
        if (agentPath) {
          const content = await fs.readFile(agentPath, "utf8");
          bundle += `==================== START: agents#${agentId} ====================\n`;
          bundle += content.trim() + "\n";
          bundle += `==================== END: agents#${agentId} ====================\n\n`;
          agentCount++;
        } else {
          OutputFormatter.warning(`Agent definition not found for '${agentId}' in team '${teamName}', skipping.`);
        }
      }
      
      let templateCount = 0;
      const templatesDir = path.join(corePath, "templates");
      const templateFiles = await glob(path.join(templatesDir, "*.md"));
      for (const templateFile of templateFiles) {
          const templateName = path.basename(templateFile);
          const templateContent = await fs.readFile(templateFile, 'utf8');
          bundle += `==================== START: templates#${templateName} ====================\n`;
          bundle += templateContent.trim() + "\n";
          bundle += `==================== END: templates#${templateName} ====================\n\n`;
          templateCount++;
      }

      const outputPath = path.join(distPath, `${teamName}.txt`);
      await fs.writeFile(outputPath, bundle, "utf8");
      OutputFormatter.success(`Created web agent bundle: ${teamName}.txt`);
      
      buildResults.push({ 
        team: teamName, 
        status: "success", 
        agents: agentCount,
        templates: templateCount,
        outputFile: `${teamName}.txt`
      });
    }

    // Display build summary
    OutputFormatter.summary({
      "Teams Processed": teamFiles.length,
      "Bundles Created": buildResults.filter(r => r.status === "success").length,
      "Teams Skipped": buildResults.filter(r => r.status === "skipped").length
    }, "Build Summary");

    // Display detailed results
    if (buildResults.length > 0) {
      OutputFormatter.table(
        buildResults.filter(r => r.status === "success"),
        ["team", "agents", "templates", "outputFile"],
        { team: "Team", agents: "Agents", templates: "Templates", outputFile: "Output File" }
      );
    }

    OutputFormatter.success("Build complete");
    return true;
  } catch (error) {
    OutputFormatter.error(`Build failed with an unexpected error: ${error.message}`);
    throw error;
  }
}