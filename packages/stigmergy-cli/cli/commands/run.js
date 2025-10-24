import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import EventSource from 'eventsource';
import WebSocket from 'ws';

export const command = 'run';
export const desc = 'Run a new mission with a specified goal or start an interactive chat session.';
export const builder = {
  goal: {
    alias: 'g',
    describe: 'The high-level goal for the mission',
    demandOption: false,
    type: 'string',
  },
  output: {
    alias: 'o',
    describe: 'The output format for mission status events',
    demandOption: false,
    type: 'string',
    choices: ['json', 'human'],
    default: 'human',
  },
  'max-session-cost': {
    describe: 'Override the maximum session cost for this mission',
    demandOption: false,
    type: 'number'
  }
};

const startInteractiveChat = async () => {
  console.log(chalk.blue('Connecting to Stigmergy Engine for interactive chat...'));
  const ws = new WebSocket('ws://localhost:3010/ws');
  const ui = new inquirer.ui.BottomBar();
  let promptActive = false;

  const prompt = async () => {
    if (promptActive) return;
    promptActive = true;
    const { message } = await inquirer.prompt([{
      type: 'input',
      name: 'message',
      message: 'You:',
    }]);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
    promptActive = false;
    // Only prompt again if the connection is still open.
    if (ws.readyState === WebSocket.OPEN) {
       prompt();
    }
  };

  ws.on('open', () => {
    ui.log.write(chalk.green('Connected! Type your message and press Enter.'));
    prompt();
  });

  ws.on('message', (data) => {
    ui.log.write(chalk.cyan('Stigmergy: ') + data.toString());
  });

  ws.on('error', (error) => {
    ui.log.write(chalk.red(`WebSocket error: ${error.message}`));
    console.log(chalk.red('Could not connect to the Stigmergy Engine. Is it running?'));
    process.exit(1);
  });

  ws.on('close', () => {
    ui.log.write(chalk.yellow('Connection closed.'));
    process.exit(0);
  });
};

export const handler = async (argv) => {
  if (argv.goal) {
    const { goal, output } = argv;
    const project_path = process.cwd();
    const maxSessionCost = argv['max-session-cost'];
    const spinner = ora('Connecting to Stigmergy Engine...').start();

    let url = `http://localhost:3010/mcp?goal=${encodeURIComponent(goal)}&project_path=${encodeURIComponent(project_path)}`;
    if (maxSessionCost) {
        url += `&max_session_cost=${maxSessionCost}`;
    }
    const es = new EventSource(url);

    let lastStatus = '';

    const handleHumanOutput = (event) => {
        try {
            if (event.data === '[DONE]') {
                spinner.succeed(chalk.green('Mission finished.'));
                es.close();
                process.exit(0);
                return;
            }

            const outerData = JSON.parse(event.data);
            const contentString = outerData.choices?.[0]?.delta?.content;
            if (!contentString) return;

            const jsonMatch = contentString.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                const innerData = JSON.parse(jsonMatch[1]);
                const { type, payload } = innerData;

                switch (type) {
                    case 'state_update':
                        const status = `[${payload.project_status}] ${payload.message || ''}`;
                        if (status !== lastStatus) {
                            spinner.succeed(lastStatus); // Finalize the last step
                            spinner.start(status); // Start a new step
                            lastStatus = status;
                        }
                        break;
                    case 'tool_start':
                        spinner.text = chalk.gray(`  → Using tool: ${payload.tool} with args ${JSON.stringify(payload.args)}`);
                        break;
                    case 'tool_end':
                         // We just go back to the main status text, so no change here.
                        spinner.text = lastStatus;
                        break;
                    case 'thought_stream':
                        spinner.stopAndPersist({
                            symbol: '🧠',
                            text: chalk.italic.dim(`  Thought: ${payload.thought}`),
                        });
                        spinner.start(lastStatus); // Continue with the main status
                        break;
                    case 'objective_update':
                        spinner.stopAndPersist({
                            symbol: '🎯',
                            text: chalk.bold.cyan(`New Objective for ${payload.agent}: ${payload.task}`),
                        });
                        spinner.start(lastStatus); // Continue
                        break;
                    default:
                        // Do nothing for other events to keep the output clean.
                        break;
                }
            } else if (!contentString.includes('json')) {
                // Initial connection messages
                spinner.text = contentString;
            }
        } catch (error) {
            // Ignore parsing errors for non-JSON messages
        }
    };

    const handleJsonOutput = (event) => {
        if (event.data === '[DONE]') {
            es.close();
            process.exit(0);
        }
        console.log(event.data); // Print the raw SSE data
    };

    es.onopen = () => {
      spinner.succeed('Connected to Stigmergy Engine.');
      console.log(chalk.blue(`🚀 Starting mission with goal: "${goal}"`));
      lastStatus = 'Mission in progress...';
      spinner.start(lastStatus);
    };

    es.onmessage = (output === 'human') ? handleHumanOutput : handleJsonOutput;

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
