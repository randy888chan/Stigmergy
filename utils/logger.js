import chalk from "chalk";

export const logger = {
  info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
  error: (msg) => console.error(chalk.red(`[ERROR] ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`[WARN] ${msg}`)),
  debug: (msg) => console.debug(chalk.gray(`[DEBUG] ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
};

export default logger;
