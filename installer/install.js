const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const CORE_SOURCE_DIR = path.join(__dirname, '..', '.stigmergy-core');
const CORE_DEST_DIR = path.join(process.cwd(), '.stigmergy-core');
const ROOMODES_PATH = path.join(process.cwd(), '.roomodes');
const AGENTS_DIR = path.join(CORE_SOURCE_DIR, 'agents');

async function install() {
  console.log('🚀 Starting Pheromind installation...');

  try {
    // 1. Copy .stigmergy-core
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    console.log('✓ Copied .stigmergy-core knowledge base.');

    // 2. Configure Roo Code (.roomodes)
    let existingModes = { customModes: [] };
    if (await fs.pathExists(ROOMODES_PATH)) {
      try {
        const existingContent = await fs.readFile(ROOMODES_PATH, 'utf8');
        const loadedYaml = yaml.load(existingContent);
        if (loadedYaml && Array.isArray(loadedYaml.customModes)) {
            existingModes = loadedYaml;
        }
      } catch (e) {
        console.warn('Could not parse existing .roomodes, it will be overwritten.');
      }
    }

    const agentFiles = await fs.readdir(AGENTS_DIR);
    for (const file of agentFiles) {
        if(file.endsWith('.md')) {
            const agentId = path.basename(file, '.md');
            const agentContent = await fs.readFile(path.join(AGENTS_DIR, file), 'utf8');
            const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
            if (!yamlMatch) continue;

            const config = yaml.load(yamlMatch[1]);

            const newMode = {
                slug: config.agent.alias,
                name: `${config.agent.icon} ${config.agent.name}`,
                // CRITICAL CHANGE: Instead of prompt text, we configure an API call.
                api: {
                  url: 'http://localhost:3000/api/execute',
                  method: 'POST',
                  // This tells Roo to send the conversation history to our engine.
                  include: ['history'], 
                  // We add the agentId to the payload.
                  static_payload: {
                    agentId: agentId
                  }
                },
                groups: ['read', 'edit', 'mcp']
            };
            
            // Remove existing mode with the same slug to avoid duplicates
            existingModes.customModes = existingModes.customModes.filter(m => m.slug !== newMode.slug);
            existingModes.customModes.push(newMode);
        }
    }

    await fs.writeFile(ROOMODES_PATH, yaml.dump(existingModes));
    console.log('✓ Configured Roo Code to communicate with the local engine.');
    console.log('\n✅ Installation complete! Create a .env file, then run "npm run engine:start" to begin.');
  } catch(error) {
      console.error("\n❌ Installation failed:", error.message);
  }
}

install();
