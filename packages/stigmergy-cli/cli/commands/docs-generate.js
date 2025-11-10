import chalk from 'chalk';
import ora from 'ora';
import EventSource from 'eventsource';

export const command = 'docs:generate';
export const desc = 'Triggers the @documentarian agent to generate system documentation.';

export const handler = async () => {
  const goal = "Execute the DOCUMENTATION_GENERATION_PROTOCOL";
  const spinner = ora('Connecting to Stigmergy Engine to generate documentation...').start();

  const url = `http://localhost:3010/mcp?goal=${encodeURIComponent(goal)}&project_path=${encodeURIComponent(process.cwd())}`;
  const es = new EventSource(url);

  es.onopen = () => {
    spinner.succeed('Connected to Stigmergy Engine.');
    spinner.start(`🚀 Requesting documentation generation from @documentarian agent...`);
  };

  es.onmessage = (event) => {
    try {
      if (event.data === '[DONE]') {
        spinner.succeed(chalk.green('Documentation generation mission finished successfully.'));
        es.close();
        process.exit(0);
      }

      const outerData = JSON.parse(event.data);
      const contentString = outerData.choices?.[0]?.delta?.content;
      if (!contentString) return;

      const jsonMatch = contentString.match(/```json\\n([\\s\\S]*?)\\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const innerData = JSON.parse(jsonMatch[1]);
        const { type, payload } = innerData;

        if (type === 'state_update') {
          const status = `[${payload.project_status}] ${payload.message || ''}`;
          spinner.text = status;
        }
      } else if (!contentString.includes('json')) {
        spinner.text = contentString;
      }
    } catch (error) {
      // Ignore parsing errors for non-JSON messages
    }
  };

  es.onerror = (error) => {
    spinner.fail(chalk.red('Connection to Stigmergy Engine failed. Is the service running?'));
    console.error(chalk.red('Please ensure the engine is running with `stigmergy start-service`'));
    es.close();
    process.exit(1);
  };
};
