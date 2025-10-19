import fs from \"fs-extra\";
import path from \"path\";
import inquirer from \"inquirer\";
import yaml from \"js-yaml\";

export async function selectWebAgentTeams(coreDir = \".stigmergy-core\") {
  const agentTeamsDir = path.join(coreDir, \"agent-teams\");
  
  if (!await fs.pathExists(agentTeamsDir)) {
    console.error(`Agent teams directory not found at ${agentTeamsDir}`);
    return [];
  }

  try {
    const teamFiles = await fs.readdir(agentTeamsDir);
    const teamChoices = [];

    for (const file of teamFiles) {
      if (file.endsWith(\".yml\") || file.endsWith(\".yaml\")) {
        const filePath = path.join(agentTeamsDir, file);
        const fileContent = await fs.readFile(filePath, \"utf8\");
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

    if (teamChoices.length === 0) {
      console.log(\"No agent teams found. Using default configuration.\");
      return ['team-all.yml'];
    }

    const { selectedTeams } = await inquirer.prompt([
      {
        type: \"checkbox\",
        name: \"selectedTeams\",
        message: \"Select the agent teams to build for web UI bundles:\",
        choices: teamChoices,
        validate: function (answer) {
          if (answer.length < 1) {
            return \"You must choose at least one team.\";
          }
          return true;
        },
      },
    ]);

    return selectedTeams;

  } catch (error) {
    console.error(\"Error reading agent teams:\", error);
    return ['team-all.yml'];
  }
}