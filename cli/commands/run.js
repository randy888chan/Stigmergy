import WebSocket from 'ws';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export const command = 'run';
export const desc = 'Run a new mission with a specified goal or start an interactive chat session.';
export const builder = {
  goal: {
    alias: 'g',
    describe: 'The high-level goal for the mission',
    demandOption: false,
    type: 'string',
  },
};

const startInteractiveChat = async () => {
  const ui = new inquirer.ui.BottomBar();
  ui.log.write(chalk.blue('Starting interactive chat session...'));

  const ws = new WebSocket('ws://localhost:3010/ws');

  const promptUser = async () => {
    try {
      const answers = await inquirer.prompt({
        type: 'input',
        name: 'userInput',
        message: 'You:',
      });

      const { userInput } = answers;

      if (userInput.toLowerCase() === '/exit') {
        ui.log.write(chalk.yellow('Disconnecting...'));
        ws.close();
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        const message = {
          type: 'user_chat_message',
          payload: {
            message: userInput,
          },
        };
        ws.send(JSON.stringify(message));
        promptUser(); // Prompt for the next input
      } else {
        ui.log.write(chalk.red('WebSocket is not open. Cannot send message.'));
      }
    } catch (error) {
      ui.log.write(chalk.red(`Error during prompt: ${error.message}`));
      ws.close();
    }
  };

  ws.on('open', () => {
    ui.log.write(chalk.green('Connected to Stigmergy Engine. Type /exit to end the session.'));
    const projectPath = process.cwd();
    const setProjectMessage = {
      type: 'set_project',
      payload: {
        path: projectPath,
      },
    };
    ws.send(JSON.stringify(setProjectMessage));
    promptUser(); // Start the input loop
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      let logMessage = '';
      if (message.type === 'log') {
        logMessage = chalk.gray(`[LOG] ${message.payload.message}`);
      } else if (message.type === 'state_update') {
        logMessage = chalk.cyan(`[STATUS] ${message.payload.project_status} - ${message.payload.message}`);
      } else if (message.type === 'project_switched') {
        logMessage = chalk.magenta(`[SYSTEM] Project context set to: ${message.payload.path}`);
      } else {
        logMessage = chalk.yellow(data.toString());
      }
      ui.log.write(logMessage);
    } catch (error) {
      ui.log.write(chalk.red('Error processing message from engine:'));
      ui.log.write(chalk.gray(data.toString()));
    }
  });

  ws.on('close', () => {
    ui.log.write(chalk.yellow('Disconnected from Stigmergy Engine.'));
    ui.close();
    process.exit(0);
  });

  ws.on('error', (error) => {
    ui.log.write(chalk.red('Connection to Stigmergy Engine failed. Is the service running?'));
    ui.log.write(chalk.red(error.message));
    ui.close();
    process.exit(1);
  });
};

export const handler = async (argv) => {
  if (argv.goal) {
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
  } else {
    await startInteractiveChat();
  }
};