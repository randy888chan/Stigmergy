import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

export default async function build() {
  const projectRoot = process.cwd();
  const corePath = path.join(projectRoot, ".stigmergy-core");
  const distPath = path.join(projectRoot, "dist");

  try {
    // Create dist directory
    await fs.ensureDir(distPath);

    // Bundle system documentation
    const docsDir = path.join(corePath, "system_docs");
    if (await fs.pathExists(docsDir)) {
      const docs = await fs.readdir(docsDir);
      for (const doc of docs) {
        if (doc.endsWith(".md")) {
          await fs.ensureDir(path.join(distPath, "system_docs"));
          await fs.copy(path.join(docsDir, doc), path.join(distPath, "system_docs", doc));
        }
      }
    }

    // Bundle agent definitions
    const agentsDir = path.join(corePath, "agents");
    if (await fs.pathExists(agentsDir)) {
      const agentFiles = await fs.readdir(agentsDir);
      const agents = [];

      for (const file of agentFiles) {
        if (!file.endsWith(".md")) continue;

        const content = await fs.readFile(path.join(agentsDir, file), "utf8");
        const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/);

        if (yamlMatch) {
          try {
            const agentData = yaml.load(yamlMatch[1]);
            agents.push(agentData);
          } catch (e) {
            console.error(`❌ Error parsing ${file}: ${e.message}`);
            throw new Error(`Invalid agent definition in ${file}: ${e.message}`);
          }
        }
      }

      await fs.writeFile(path.join(distPath, "agents.json"), JSON.stringify({ agents }, null, 2));
    }

    // Create web instructions
    await fs.writeFile(
      path.join(distPath, "README.md"),
      `# Stigmergy Web Agent Bundle\n\n` +
        `This bundle contains all agent definitions needed for web-based environments.`
    );

    console.log(`\n✅ Successfully built dist/ folder`);
    return true;
  } catch (error) {
    console.error("❌ Build failed:", error);
    throw error;
  }
}
