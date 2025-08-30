import fs from "fs-extra";
import path from "path";

export async function configureIde(targetDir) {
  const roomodesPath = path.join(targetDir, ".roomodes");
  const content = `# This file is managed by Stigmergy
# It configures the available agent teams for your IDE
`;
  await fs.writeFile(roomodesPath, content);
  console.log("✅ .roomodes file configured for IDE integration.");
}
