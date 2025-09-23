import { vol } from 'memfs';
import { init } from '../../cli/commands/init.js';
import fs from 'fs-extra';
import path from 'path';

// Mock the file system
jest.mock('fs-extra', () => require('memfs').fs);
jest.mock('inquirer', () => ({ prompt: jest.fn().mockResolvedValue({ configureKeys: false }) }));


describe('stigmergy init', () => {
  beforeEach(() => {
    vol.reset();
    // Pre-populate the project.env.example template in the in-memory file system
    const templatePath = path.resolve(__dirname, '../../cli/templates/project.env.example');
    vol.fromJSON({
      [templatePath]: 'PROJECT_NAME=my-new-app'
    }, path.resolve(__dirname, '../..'));
  });

  test('should create a simplified .env.stigmergy.example file in the project directory', async () => {
    await init({ interactive: false }); // Run in non-interactive mode for the test

    const envExamplePath = path.join(process.cwd(), '.stigmergy/.env.stigmergy.example');
    const envExampleContent = await fs.readFile(envExamplePath, 'utf8');

    // Assert that the content is the new, simple version
    expect(envExampleContent).toContain('PROJECT_NAME=my-new-app');
    // Assert that it does NOT contain complex, global-level keys
    expect(envExampleContent).not.toContain('GOOGLE_API_KEY');
    expect(envExampleContent).not.toContain('OPENROUTER_API_KEY');
  });
});
