import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { glob } from "glob";

const WEB_BUNDLE_HEADER = `CRITICAL: You are an AI agent operating in a limited, web-only environment.
- You DO NOT have access to a file system, code execution, or custom tools beyond web search.
- Your primary goal is to collaborate with a human user to generate high-level planning documents (like a PRD or an Architecture Plan).
- Your output will be saved and handed off to a full, IDE-based autonomous AI system that has a complete toolset.
- ALWAYS use your web search capability to inform your answers. Do not invent information.
- The following content is a bundle of specialized AI agent personas and templates. Interpret this bundle to fulfill the user's high-level goal.\n\n`;

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
    const corePath = path.join(process.cwd(), ".stigmergy-core");
    const distPath = path.join(process.cwd(), "dist");
    await fs.ensureDir(distPath);

    const teamsDir = path.join(corePath, "agent-teams");
    const teamFiles = await glob(path.join(teamsDir, "*.{yml,yaml}"));

    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile).replace(/\.ya?ml$/, "");
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      if (!teamData || !teamData.bundle) {
        console.warn(`⚠️ Skipping ${teamFile} because it has no root 'bundle' property.`);
        continue;
      }

      const bundleConfig = teamData.bundle;
      const bundleName = bundleConfig.name || teamName;
      
      let bundle = "";
      bundle += `# Web Agent Bundle: ${bundleName}\n\n`;
      bundle += WEB_BUNDLE_HEADER;

      for (const agentId of bundleConfig.agents) {
        const agentPath = findAgentFile(corePath, agentId);
        if (agentPath) {
          const content = await fs.readFile(agentPath, "utf8");
          bundle += `==================== START: agents#${agentId} ====================\n`;
          bundle += content.trim() + "\n";
          bundle += `==================== END: agents#${agentId} ====================\n\n`;
        } else {
          console.warn(`- Agent definition not found for '${agentId}' in team '${teamName}', skipping.`);
        }
      }
      
      const templatesDir = path.join(corePath, "templates");
      const templateFiles = await glob(path.join(templatesDir, "*.md"));
      for (const templateFile of templateFiles) {
          const templateName = path.basename(templateFile);
          const templateContent = await fs.readFile(templateFile, 'utf8');
          bundle += `==================== START: templates#${templateName} ====================\n`;
          bundle += templateContent.trim() + "\n";
          bundle += `==================== END: templates#${templateName} ====================\n\n`;
      }

      const outputPath = path.join(distPath, `${teamName}.txt`);
      await fs.writeFile(outputPath, bundle, "utf8");
      console.log(`✅ Created web agent bundle: ${teamName}.txt`);
    }

    console.log(`✅ Build complete. Created ${teamFiles.length} agent team bundles in dist/`);
    return true;
  } catch (error) {
    console.error("❌ Build failed with an unexpected error:", error);
    throw error;
  }
}