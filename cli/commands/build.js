import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
const WEB_BUNDLE_HEADER = `CRITICAL: You are an AI agent operating in a limited, web-only environment.
- You DO NOT have access to a file system, code execution, or custom tools beyond web search.
- Your primary goal is to collaborate with a human user to generate high-level planning documents (like a PRD or an Architecture Plan).
- Your output will be saved and handed off to a full, IDE-based autonomous AI system that has a complete toolset.
- ALWAYS use your web search capability to inform your answers. Do not invent information.
- The following content is a bundle of specialized AI agent personas and templates. Interpret this bundle to fulfill the user's high-level goal.
`;

export default async function build() {
  const corePath = global.StigmergyConfig?.core_path || path.join(process.cwd(), ".stigmergy-core");
  const distPath = path.join(process.cwd(), "dist");
  await fs.ensureDir(distPath);

  const teamFilesDir = path.join(corePath, "agent-teams");
  const files = await fs.readdir(teamFilesDir);
  const teamFiles = files
    .filter(file => file.endsWith('.yml'))
    .map(file => path.join(teamFilesDir, file));
  const createdFiles = [];

  for (const teamFile of teamFiles) {
    const teamName = path.basename(teamFile, ".yml");
    const teamData = yaml.load(await fs.readFile(teamFile, "utf8"));
    if (!teamData || !teamData.bundle) {
        console.log(`Skipping ${teamFile} because it has no bundle property`);
        continue;
    }
    let bundle = `# Web Agent Bundle: ${teamData.bundle.name}\n\n${WEB_BUNDLE_HEADER}\n`;

    for (const agentId of teamData.agents) {
      const agentPath = path.join(corePath, "agents", `${agentId}.md`);
      if (await fs.pathExists(agentPath)) {
        const content = await fs.readFile(agentPath, "utf8");
        bundle += `==================== START: agents#${agentId} ====================\n`;
        bundle += content + "\n";
        bundle += `==================== END: agents#${agentId} ====================\n\n`;
      }
    }
    // ... logic to append templates ...
    const outputPath = path.join(distPath, `${teamName}.txt`);
    await fs.writeFile(outputPath, bundle);
    createdFiles.push(outputPath);
  }
  return createdFiles;
}
