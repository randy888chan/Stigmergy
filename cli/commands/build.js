import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import yaml from "js-yaml";

export default async function build() {
  try {
    const projectRoot = process.cwd();
    const outputDir = path.join(projectRoot, "dist");
    await fs.ensureDir(outputDir);

    // 1. Process each agent team
    const teamsDir = path.join(projectRoot, ".stigmergy-core", "agent-teams");
    const teamFiles = await glob(path.join(teamsDir, "*.yml"));

    for (const teamFile of teamFiles) {
      const teamName = path.basename(teamFile, ".yml");
      const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));

      // 2. Start building the bundle content
      let bundle = `# Web Agent Bundle: ${teamData.bundle.name}\n\n`;
      bundle +=
        "You are now operating as a specialized AI agent from the Stigmergy framework. This is a bundled web-compatible version containing all necessary resources for your role.\n\n";
      bundle += "## Important Instructions\n";
      bundle +=
        "1. **Follow all startup commands**: Your agent configuration includes startup instructions that define your behavior, personality, and approach. These MUST be followed exactly.\n";
      bundle +=
        "2. **Resource Navigation**: This bundle contains all resources you need. Resources are marked with tags like:\n";
      bundle += "- `==================== START: folder#filename ====================`\n";
      bundle += "- `==================== END: folder#filename ====================`\n\n";

      // 3. Add all agent definitions to the bundle
      for (const agentId of teamData.agents) {
        const agentFile = path.join(projectRoot, ".stigmergy-core", "agents", `${agentId}.md`);

        if (await fs.pathExists(agentFile)) {
          const content = await fs.readFile(agentFile, "utf8");
          const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);

          if (yamlMatch && yamlMatch[1]) {
            try {
              const agentData = yaml.load(yamlMatch[1]);

              // Add agent header
              bundle += `==================== START: agents#${agentId} ====================\n`;
              bundle += `# ${agentData.agent.name} (${agentData.agent.alias})\n\n`;

              // Add persona role
              bundle += `**Role**: ${agentData.persona.role}\n\n`;

              // Add core protocols
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
        }
      }

      // 4. Add the templates directory to the bundle (CRITICAL FOR CONSISTENCY)
      const templatesDir = path.join(projectRoot, ".stigmergy-core", "templates");
      const templateFiles = await glob(path.join(templatesDir, "*.md"));

      for (const templateFile of templateFiles) {
        const templateName = path.basename(templateFile);
        const templateContent = await fs.readFile(templateFile, "utf8");

        // Add template to bundle with proper START/END tags
        bundle += `==================== START: templates#${templateName} ====================\n`;
        bundle += templateContent.trim() + "\n";
        bundle += `==================== END: templates#${templateName} ====================\n\n`;
      }

      // 5. Write the bundle to dist
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
