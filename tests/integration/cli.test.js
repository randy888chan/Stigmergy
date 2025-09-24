/**
 * @jest-environment node
 */
import { vol } from 'memfs';
import { jest } from '@jest/globals';
import path from 'path';

// Mock the file system and inquirer
jest.unstable_mockModule('fs-extra', () => jest.requireActual('memfs'));
jest.unstable_mockModule('inquirer', () => ({
    default: {
        prompt: jest.fn().mockResolvedValue({ configureKeys: false })
    }
}));


describe.skip('stigmergy init', () => {
  let init;
  let fs;

  beforeEach(async () => {
    // Dynamically import the modules after mocks are set
    const initModule = await import('../../cli/commands/init.js');
    init = initModule.init;
    fs = (await import('fs-extra')).default; // memfs provides fs methods on the default export

    vol.reset();
    // The init function will look for a template file. We need to create it in our memory FS.
    // The path is relative to the init.js file: ../templates/project.env.example
    // So from the project root, it's /cli/templates/project.env.example
    const templatePath = path.resolve(process.cwd(), 'cli/templates/project.env.example');
    const templateDir = path.dirname(templatePath);

    // Create the directory and file in the in-memory filesystem
    fs.mkdirSync(templateDir, { recursive: true });
    fs.writeFileSync(templatePath, 'PROJECT_NAME=my-new-app');
  });

  afterEach(() => {
    vol.reset();
    jest.resetModules();
  });

  test('should create a simplified .env.stigmergy.example file in the project directory', async () => {
    await init({ interactive: false }); // Run in non-interactive mode for the test

    const envExamplePath = path.join(process.cwd(), '.stigmergy/.env.stigmergy.example');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

    // Assert that the content is the new, simple version
    expect(envExampleContent).toContain('PROJECT_NAME=my-new-app');
    // Assert that it does NOT contain complex, global-level keys
    expect(envExampleContent).not.toContain('GOOGLE_API_KEY');
    expect(envExampleContent).not.toContain('OPENROUTER_API_KEY');
  });
});
