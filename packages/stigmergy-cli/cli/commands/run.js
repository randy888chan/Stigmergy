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
  const ui = new inquirer.ui.BottomBar();
  ui.log.write(chalk.blue('Interactive chat requires a WebSocket connection. Use `stigmergy run --goal "your goal"` to run a mission.'));
  process.exit(0);
};

export const handler = async (argv) => {
  if (argv.goal) {
    const { goal } = argv;
    const project_path = process.cwd();
    const spinner = ora('Connecting to Stigmergy Engine...').start();

    const url = 'http://localhost:3010/mcp';
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
            process.exit(0);
        }

        const outerData = JSON.parse(event.data);
        if (outerData.choices && outerData.choices[0].delta.content) {
            const contentString = outerData.choices[0].delta.content;
            // The content itself is a JSON string inside ```json ... ```, so we need to extract and parse it.
            const jsonMatch = contentString.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                const innerData = JSON.parse(jsonMatch[1]);
                if (innerData.type === 'state_update') {
                    const { project_status, message: statusMessage } = innerData.payload;
                    spinner.text = `[${project_status}] ${statusMessage || ''}`;
                } else {
                    spinner.text = `Received event: ${innerData.type}`;
                }
            } else if (!contentString.includes('json')) { // Don't log the big JSON blocks
                spinner.text = contentString;
            }
        }
      } catch (error) {
        //spinner.warn(`Non-JSON message received: ${event.data}`);
      }
    };

    es.onerror = (error) => {
      spinner.fail(chalk.red('Connection to Stigmergy Engine failed. Is the service running?'));
      console.error(chalk.red('Please ensure the engine is running with `stigmergy start-service`'));
      es.close();
      process.exit(1);
    };

  } else {
    await startInteractiveChat();
  }
};
