import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import EventSource from 'eventsource';

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
  // This function remains unchanged for now, as it requires a WebSocket connection.
  // The primary refactoring is focused on the goal-oriented execution.
  const ui = new inquirer.ui.BottomBar();
  ui.log.write(chalk.blue('Interactive chat requires a WebSocket connection. Use `stigmergy run --goal "your goal"` to run a mission.'));
  process.exit(0);
};

export const handler = async (argv) => {
  if (argv.goal) {
    const { goal } = argv;
    const project_path = process.cwd();
    const spinner = ora('Connecting to Stigmergy Engine...').start();

    // Use EventSource to connect to the SSE endpoint
    const url = 'http://localhost:3010/mcp';
    // EventSource in Node.js doesn't natively support sending a POST body.
    // We will pass the goal and path as query parameters for this CLI use case.
    const es = new EventSource(`${url}?goal=${encodeURIComponent(goal)}&project_path=${encodeURIComponent(project_path)}`);

    es.onopen = () => {
      spinner.succeed('Connected to Stigmergy Engine.');
      console.log(chalk.blue(`🚀 Starting mission with goal: "${goal}"`));
      spinner.start('Mission in progress...');
    };

    es.onmessage = (event) => {
      try {
        if (event.data === '[DONE]') {
            spinner.succeed(chalk.green(`Mission finished.`));
            es.close();
            return;
        }

        const message = JSON.parse(event.data);

        // Assuming the server sends status updates through the SSE stream
        // in a format like { type: 'state_update', payload: { ... } }
        if (message.type === 'state_update') {
          const { project_status, message: statusMessage } = message.payload;
          spinner.text = `[${project_status}] ${statusMessage || ''}`;
          if (project_status === 'EXECUTION_COMPLETE' || project_status === 'COMPLETED' || project_status === 'PLAN_EXECUTED' || project_status === 'ERROR') {
             if (project_status === 'ERROR') {
               spinner.fail(chalk.red(`Mission failed: ${project_status}`));
             } else {
               spinner.succeed(chalk.green(`Mission finished with status: ${project_status}`));
             }
             es.close();
           }
        } else if (message.choices && message.choices[0].delta && message.choices[0].delta.content) {
            // Handle streaming text for thought process or logs
            const content = message.choices[0].delta.content;
            spinner.text = content;
        } else {
            // Fallback for other message types
            // console.log(chalk.gray(event.data));
        }
      } catch (error) {
        // Ignore parsing errors for non-JSON messages if any
      }
    };

    es.onerror = (error) => {
      spinner.fail(chalk.red('Connection to Stigmergy Engine failed. Is the service running?'));
      console.error(chalk.red(JSON.stringify(error, null, 2)));
      es.close();
    };

  } else {
    await startInteractiveChat();
  }
};
