import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from 'url';

// Helper to get the project root, assuming the CLI is run from the project root
const getProjectRoot = () => process.cwd();

// Helper to read the stigmergy config
async function getCustomToolsPath() {
  const projectRoot = getProjectRoot();
  const configPath = path.join(projectRoot, 'stigmergy.config.js');

  if (await fs.pathExists(configPath)) {
    try {
      // Use dynamic import for ES module
      const configModule = await import(`file://${configPath}`);
      const config = configModule.default;
      if (config && config.custom_tools_path) {
        return path.resolve(projectRoot, config.custom_tools_path);
      }
    } catch (e) {
      console.error(chalk.red('Error reading stigmergy.config.js:'), e);
      return null;
    }
  }
  return path.resolve(projectRoot, 'stigmergy-tools'); // Default value
}

// Main function for the 'add-tool' command
export async function addTool({ name }) {
  if (!name) {
    console.error(chalk.red("❌ Please provide a name for the tool using the --name option."));
    return;
  }

  const toolsDir = await getCustomToolsPath();
  if (!toolsDir) {
    console.error(chalk.red("❌ Could not determine the custom tools directory."));
    return;
  }

  const toolFileName = `${name}.js`;
  const toolFilePath = path.join(toolsDir, toolFileName);

  console.log(chalk.blue(`🔧 Creating a new tool named '${name}' at ${toolFilePath}...`));

  try {
    // Ensure the directory exists
    await fs.ensureDir(toolsDir);

    // Check if the tool file already exists
    if (await fs.pathExists(toolFilePath)) {
      console.error(chalk.red(`❌ A tool with the name '${name}' already exists at ${toolFilePath}.`));
      return;
    }

    // Create the boilerplate content
    const boilerplate = `// Stigmergy Custom Tool: ${name}
// This is a boilerplate for a new tool.

// All functions exported from this file will be available as tools under the namespace '${name}'.
// For example, the function 'myFunction' below will be available as '${name}.myFunction'.

/**
 * @description A brief description of what your function does.
 * @param {object} args - The arguments for your function.
 * @param {string} args.example_argument - An example argument.
 * @returns {Promise<string>} A promise that resolves with the result.
 */
export async function myFunction({ example_argument }) {
  console.log(\`Running ${name}.myFunction with argument: \${example_argument}\`);

  // Your tool logic goes here
  const result = \`Hello from ${name}! You passed: \${example_argument}\`;

  return result;
}

// You can add more exported functions here.
`;

    // Write the file
    await fs.writeFile(toolFilePath, boilerplate);

    console.log(chalk.green(`✅ Successfully created the new tool: ${toolFileName}`));
    console.log(chalk.gray(`   - Location: ${toolFilePath}`));
    console.log(chalk.yellow(`   - To use it in an agent, grant permission to '${name}.*'.`));

  } catch (error) {
    console.error(chalk.red(`❌ An error occurred while creating the tool:`), error);
  }
}
