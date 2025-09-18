import coreBackup from '../services/core_backup.js';
import chalk from 'chalk';

async function restore() {
  console.log(chalk.blue('Attempting to restore .stigmergy-core from the latest backup...'));
  const success = await coreBackup.restoreLatest();
  if (success) {
    console.log(chalk.green('✅ Successfully restored .stigmergy-core from backup.'));
  } else {
    console.error(chalk.red('❌ No backup found to restore.'));
  }
}

restore();
