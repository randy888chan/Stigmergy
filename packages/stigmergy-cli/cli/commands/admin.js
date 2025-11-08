import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import chalk from 'chalk';

export function createAdminCommand() {
  const admin = new Command('admin').description('Admin commands for user and key management.');

  admin
    .command('create-key <username> <role>')
    .description('Create a new API key for a user with a specific role.')
    .action(async (username, role) => {
      try {
        const rbacPath = path.join(process.cwd(), '.stigmergy-core', 'governance', 'rbac.yml');
        const config = yaml.load(await fs.readFile(rbacPath, 'utf8'));

        // Check if the role is valid
        if (!config.roles[role]) {
          console.error(chalk.red(`Error: Role '${role}' does not exist in rbac.yml.`));
          return;
        }

        const apiKey = `stg_key_${role.toLowerCase().slice(0, 3)}_${crypto.randomBytes(16).toString('hex')}`;
        config.users.push({ username, role, key: apiKey });
        await fs.writeFile(rbacPath, yaml.dump(config));

        console.log(chalk.green(`API key created for user '${username}' with role '${role}':`));
        console.log(chalk.yellow(apiKey));
      } catch (error) {
        console.error(chalk.red('Failed to create key:'), error);
      }
    });
  return admin;
}
