import WebSocket from 'ws';
import chalk from 'chalk';
import ora from 'ora';

export const command = 'run';
export const desc = 'Run a new mission with a specified goal';
export const builder = {
  goal: {
    alias: 'g',
    describe: 'The high-level goal for the mission',
    demandOption: true,
    type: 'string',
  },
};

export const handler = async (argv) => {
  const { goal } = argv;
  const project_path = process.cwd();
  const spinner = ora('Connecting to Stigmergy Engine...').start();

  const ws = new WebSocket('ws://localhost:3010/ws');

  ws.on('open', () => {
    spinner.succeed('Connected to Stigmergy Engine.');
    console.log(chalk.blue(`🚀 Starting mission with goal: "${goal}"`));

    const message = {
      type: 'start_mission',
      payload: {
        goal,
        project_path,
      },
    };
    ws.send(JSON.stringify(message));
    spinner.start('Mission in progress...');
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'state_update') {
        const { project_status, message: statusMessage } = message.payload;
        spinner.text = `[${project_status}] ${statusMessage || ''}`;

        if (project_status === 'EXECUTION_COMPLETE' || project_status === 'COMPLETED' || project_status === 'PLAN_EXECUTED' || project_status === 'ERROR') {
          if (project_status === 'ERROR') {
            spinner.fail(chalk.red(`Mission failed: ${project_status}`));
          } else {
            spinner.succeed(chalk.green(`Mission finished with status: ${project_status}`));
          }
          ws.close();
        }
      } else if (message.type === 'project_switched') {
          spinner.info(`Engine context switched to: ${message.payload.path}`);
      } else {
        // Fallback for any other message type
        console.log(chalk.gray(data.toString()));
      }
    } catch (error) {
      console.error(chalk.red('Error processing message from engine:'), error);
      console.log(chalk.gray('Raw message:', data.toString()));
    }
  });

  ws.on('close', () => {
    if (spinner.isSpinning) {
        spinner.succeed('Disconnected from Stigmergy Engine.');
    }
  });

  ws.on('error', (error) => {
    spinner.fail(chalk.red('Connection to Stigmergy Engine failed. Is the service running?'));
    console.error(chalk.red(error.message));
  });
};