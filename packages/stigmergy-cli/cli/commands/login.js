import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

const configDir = path.join(os.homedir(), '.stigmergy');
const configFile = path.join(configDir, 'config.json');

async function saveToken(token) {
  try {
    await fs.ensureDir(configDir);
    let config = {};
    if (await fs.pathExists(configFile)) {
      config = await fs.readJson(configFile);
    }
    config.dopplerToken = token;
    await fs.writeJson(configFile, config, { spaces: 2 });
    console.log(chalk.green('Doppler token saved successfully.'));
  } catch (error) {
    console.error(chalk.red('Failed to save Doppler token:'), error);
    process.exit(1);
  }
}

export function createLoginCommand() {
  const command = new Command('login')
    .description('Authenticate with external services. Currently supports Doppler.')
    .argument('<token>', 'Doppler Service Token')
    .action(async (token) => {
      await saveToken(token);
    });

  return command;
}
