import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { glob } from "glob";

export default async function build() {
  try {
    const projectRoot = process.cwd();
    const corePath = (global.StigmergyConfig && global.StigmergyConfig.core_path) || path.join(projectRoot, ".stigmergy-core");
    const distPath = path.join(projectRoot, "dist");

    await fs.ensureDir(distPath);

    const teamsDir = path.join(corePath, "agent-teams");
    const teamFiles = await glob(path.join(teamsDir, "*.yml"));

    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile, ".yml");
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      const bundleName = (teamData.bundle && teamData.bundle.name) || teamName;
      let bundle = `# Web Agent Bundle: ${bundleName}\n\n`;
      bundle += "CRITICAL: You are a master agent orchestrator. The following content is a bundle of specialized AI agent definitions and templates. Your task is to interpret this bundle and use it to fulfill the user's high-level goal by embodying the appropriate agent personas and following their core protocols.\n\n";

      for (const agentId of teamData.agents) {
        const agentPath = findAgentFile(corePath, agentId);
        if (!agentPath) {
          console.warn(`⚠️ Skipping agent ${agentId}: file not found.`);
          continue;
        }

        const content = await fs.readFile(agentPath, "utf8");
        const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)```/);
        if (!yamlMatch || !yamlMatch[1]) {
          console.warn(`⚠️ Skipping ${agentId}: No YAML content found`);
          continue;
        }

        // This is the critical part: we include the full, original YAML block.
        const originalYamlBlock = yamlMatch[1].trim();

        bundle += `==================== START: agents#${agentId} ====================\n`;
        bundle += "```yaml\n";
        bundle += originalYamlBlock;
        bundle += "\n```\n";
        bundle += `==================== END: agents#${agentId} ====================\n\n`;
      }

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
