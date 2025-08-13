import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { glob } from "glob";

export default async function build() {
  try {
    const projectRoot = process.cwd();
    const corePath = (global.StigmergyConfig && global.StigmergyConfig.core_path) || path.join(projectRoot, ".stigmergy-core");
    const distPath = path.join(projectRoot, "dist");

    // Clean and prepare dist directory
    await fs.ensureDir(distPath);

    // Process each agent team
    const teamsDir = path.join(corePath, "agent-teams");
    const teamFiles = await glob(path.join(teamsDir, "*.yml"));

    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile, ".yml");
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      // Create web instructions with proper formatting
      const bundleName = (teamData.bundle && teamData.bundle.name) || teamName;
      let bundle = `# Web Agent Bundle: ${bundleName}\n\n`;
      bundle +=
        "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
      bundle +=
        "1. **Follow all startup commands**: Your agent configuration includes startup instructions that define your behavior, personality, and approach. These MUST be followed exactly.\n";
      bundle +=
        "2. **Resource Navigation**: This bundle contains all resources you need. Resources are marked with tags like:\n";
      bundle += "- `==================== START: folder#filename ====================`\n";
      bundle += "- `==================== END: folder#filename ====================`\n\n";

      // Add all agents with proper YAML formatting
      for (const agentId of teamData.agents) {
        const agentPath = findAgentFile(corePath, agentId);
        if (!agentPath) {
          console.warn(`⚠️ Skipping agent ${agentId}: file not found.`);
          continue;
        }

        const content = await fs.readFile(agentPath, "utf8");
        const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/);
        if (!yamlMatch) {
          console.warn(`⚠️ Skipping ${agentId}: No YAML content found`);
          continue;
        }

        try {
          const agentData = yaml.load(yamlMatch[1]);

          // Format agent data correctly (like your sample code)
          bundle += `==================== START: agents#${agentId} ====================\n`;
          bundle += "```yaml\n";

          const agent = agentData.agent;

          // Add agent properties with proper formatting
          bundle += `id: "${agent.id}"\n`;
          bundle += `name: "${agent.name}"\n`;
          bundle += `alias: "${agent.alias}"\n`;

          if (agent.persona) {
            bundle += "persona:\n";
            bundle += `  role: "${agent.persona.role}"\n`;
            if (agent.persona.style) {
              bundle += `  style: "${agent.persona.style}"\n`;
            }
          }

          if (agentData.core_protocols) {
            bundle += "core_protocols:\n";
            for (const protocol of agentData.core_protocols) {
              bundle += `  - "${protocol}"\n`;
            }
          }

          if (agentData.tools) {
            bundle += "tools:\n";
            for (const tool of agentData.tools) {
              bundle += `  - "${tool}"\n`;
            }
          }

          bundle += "```\n";
          bundle += `==================== END: agents#${agentId} ====================\n\n`;
        } catch (e) {
          console.warn(`⚠️ Skipping agent ${agentId} due to YAML parse error: ${e.message}`);
        }
      }

      // Add all templates with proper formatting
      const templatesDir = path.join(corePath, "templates");
      if (await fs.pathExists(templatesDir)) {
        const templateFiles = await glob(path.join(templatesDir, "*.md"));

        for (const templateFile of templateFiles) {
          const templateName = path.basename(templateFile);
          const templateContent = await fs.readFile(templateFile, "utf8");

          bundle += `==================== START: templates#${templateName} ====================\n`;
          bundle += templateContent.trim() + "\n";
          bundle += `==================== END: templates#${templateName} ====================\n\n`;
        }
      }

      // Save as TXT file
      const outputPath = path.join(distPath, `${teamName}.txt`);
      await fs.writeFile(outputPath, bundle, "utf8");
      console.log(`✅ Created web agent bundle: ${teamName}.txt`);
    }

    console.log(`✅ Build complete. Created ${teamFiles.length} planning TXT files in dist/`);
    return true;
  } catch (error) {
    console.error("❌ Build failed:", error);
    throw error;
  }
}

/**
 * Find agent file with multiple possible extensions
 */
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
