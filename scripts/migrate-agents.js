import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

async function migrateAgents() {
  console.log('Starting agent migration script...');
  const agentsDir = path.join(process.cwd(), '.stigmergy-core', 'agents');

  if (!fs.existsSync(agentsDir)) {
    console.log('Agent directory not found. Nothing to migrate.');
    return;
  }

  // 1. Rename meta.md to metis.md if it exists
  const oldPath = path.join(agentsDir, 'meta.md');
  const newPath = path.join(agentsDir, 'metis.md');
  if (fs.existsSync(oldPath)) {
    await fs.move(oldPath, newPath, { overwrite: true });
    console.log('Renamed meta.md to metis.md');
  }

  // 2. Fix YAML formatting in all agent files
  const files = await fs.readdir(agentsDir);
  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) continue;

    console.log(`Processing ${file}...`);
    const content = await fs.readFile(filePath, 'utf8');

    const yamlRegex = /```(yaml|yml)\n([\s\S]*?)\s*```/;
    const yamlMatch = content.match(yamlRegex);

    if (yamlMatch && yamlMatch[2]) {
      const originalYaml = yamlMatch[2];
      // Add a space after a colon if it's followed by a non-space character
      const fixedYaml = originalYaml.replace(/:(\S)/g, ': $1');

      if (originalYaml !== fixedYaml) {
        const newContent = content.replace(originalYaml, fixedYaml);
        await fs.writeFile(filePath, newContent, 'utf8');
        console.log(`  -> Fixed YAML formatting in ${file}`);
      } else {
        console.log(`  -> YAML formatting is already correct in ${file}`);
      }
    } else {
      console.log(`  -> No YAML block found in ${file}`);
    }
  }

  console.log('Agent migration script finished.');
}

migrateAgents().catch(error => {
  console.error('An error occurred during agent migration:', error);
  process.exit(1);
});
