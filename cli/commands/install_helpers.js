import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import yaml from "js-yaml";

export async function configureIde(targetDir) {
  const roomodesPath = path.join(targetDir, ".roomodes");
  const agentTeamsDir = path.join(targetDir, ".stigmergy-core", "agent-teams");

  try {
    const teamFiles = await fs.readdir(agentTeamsDir);
    const teamChoices = [];

    for (const file of teamFiles) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const filePath = path.join(agentTeamsDir, file);
        const fileContent = await fs.readFile(filePath, "utf8");
        const teamData = yaml.load(fileContent);
        if (teamData?.bundle?.name) {
          teamChoices.push({
            name: `${teamData.bundle.name} - ${teamData.bundle.description}`,
            value: file,
            checked: file === 'team-all.yml' // Default to all
          });
        }
      }
    }

    const { selectedTeams } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedTeams",
        message: "Select the agent teams to activate for your IDE:",
        choices: teamChoices,
        validate: function (answer) {
          if (answer.length < 1) {
            return "You must choose at least one team.";
          }
          return true;
        },
      },
    ]);

    const content = `# This file is managed by Stigmergy
# It configures the available agent teams for your IDE
# Selected teams:
${selectedTeams.join('\n')}
`;
    await fs.writeFile(roomodesPath, content);
    console.log("✅ .roomodes file configured with selected agent teams.");

  } catch (error) {
    console.error("❌ Error configuring IDE:", error);
    // Fallback to default
    const content = `# This file is managed by Stigmergy
# Default configuration due to an error during team selection.
team-all.yml
`;
    await fs.writeFile(roomodesPath, content);
    console.log("✅ .roomodes file created with default settings.");
  }
}
