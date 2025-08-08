import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";

export default async function build() {
  const projectRoot = process.cwd();

  // Respect the core_path from global config if it's set (for testing)
  const corePath = global.StigmergyConfig?.core_path || path.join(projectRoot, ".stigmergy-core");

  if (!fs.existsSync(corePath)) {
    throw new Error("CRITICAL: .stigmergy-core missing - aborting build");
  }

  try {
    const outputDir = path.join(projectRoot, "dist");
    await fs.ensureDir(outputDir);

    const teamsDir = path.join(corePath, "agent-teams");
    if (!fs.existsSync(teamsDir)) {
        console.log("✅ Build complete. No agent teams found to bundle.");
        return true;
    }
    const teamFiles = await glob(path.join(teamsDir, "*.yml"));

    const agentsPath = path.join(corePath, "agents");
    const agentFiles = await fs.readdir(agentsPath);
    console.log(`Found ${agentFiles.length} agent definitions to bundle`);

    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile, ".yml");
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      let bundle = `# Web Agent Bundle: ${teamData.bundle.name}\n\n`;
      bundle += "You are now operating as a specialized AI agent from the Stigmergy framework. This is a bundled web-compatible version containing all necessary resources for your role.\n\n";
      bundle += "## Important Instructions\n";
      bundle += "1. **Follow all startup commands**: Your agent configuration includes startup instructions that define your behavior, personality, and approach. These MUST be followed exactly.\n";
      bundle += "2. **Resource Navigation**: This bundle contains all resources you need. Resources are marked with tags like:\n";
      bundle += "- `==================== START: folder#filename ====================`\n";
      bundle += "- `==================== END: folder#filename ====================`\n\n";

      for (const agentId of teamData.agents) {
        const agentExtensions = ['.md', '.yml', '.yaml'];
        let agentFilePath = null;
        let agentFileName = null;

        for (const ext of agentExtensions) {
            const currentFile = `${agentId}${ext}`;
            const fullPath = path.join(agentsPath, currentFile);
            if (await fs.pathExists(fullPath)) {
                agentFilePath = fullPath;
                agentFileName = currentFile;
                break;
            }
        }

        if (!agentFilePath) {
            console.warn(`Skipping agent ${agentId}: file not found.`);
            continue;
        }

        const content = await fs.readFile(agentFilePath, 'utf8');

        const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
        if (!yamlMatch) {
            console.warn(`Skipping ${agentFileName}: No YAML content found`);
            continue;
        }

        try {
            const agentData = yaml.load(yamlMatch[1]);

            bundle += `==================== START: agents#${agentId} ====================\n`;
            bundle += `# ${agentData.agent.name} (${agentData.agent.alias})\n\n`;
            bundle += `**Role**: ${agentData.persona.role}\n\n`;
            bundle += `**Core Protocols**:\n`;
            for (const protocol of agentData.core_protocols) {
            if (typeof protocol === "string") {
                bundle += `- ${protocol}\n`;
            } else if (typeof protocol === "object") {
                for (const key in protocol) {
                bundle += `- ${key}: ${protocol[key]}\n`;
                }
            }
            }
            bundle += "\n";
            bundle += `==================== END: agents#${agentId} ====================\n\n`;
        } catch (e) {
            console.warn(`Skipping agent in bundle due to YAML parse error: ${agentId}`);
        }
      }

      const templatesDir = path.join(corePath, "templates");
      const templateFiles = await glob(path.join(templatesDir, "*.md"));

      for (const templateFile of templateFiles) {
        const templateName = path.basename(templateFile);
        const templateContent = await fs.readFile(templateFile, "utf8");
        bundle += `==================== START: templates#${templateName} ====================\n`;
        bundle += templateContent.trim() + "\n";
        bundle += `==================== END: templates#${templateName} ====================\n\n`;
      }

      const outputPath = path.join(outputDir, `${teamName}.txt`);
      await fs.writeFile(outputPath, bundle, "utf8");
      console.log(`✅ Created web agent bundle: ${teamName}.txt`);
    }

    console.log("✅ Build complete. Web agent bundles created in /dist");
    return true;
  } catch (error) {
    console.error("❌ Build failed:", error);
    return false;
  }
}
