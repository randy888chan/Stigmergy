// Note the imports are from "bun:test"
import { test, expect, beforeEach, mock } from 'bun:test';
import { vol } from 'memfs';
import path from 'path';

// THE BUN WAY: Mock the module and define its exports.
mock.module('fs-extra', () => ({
  ...require('memfs').fs,
  __esModule: true, // Important for ESM compatibility
}));
mock.module('inquirer', () => ({
  default: {
    prompt: () => Promise.resolve({ configureKeys: false }),
  },
  __esModule: true,
}));

// NOW, import the modules. Bun will give us the mocked versions.
import fs from 'fs-extra';
import { init } from '../../cli/commands/init.js';


describe('stigmergy init (with Bun)', () => {
  beforeEach(() => {
    vol.reset();
    // Pre-populate the project.env.example template
    const templatePath = path.resolve(import.meta.dir, '../../cli/templates/project.env.example');
    vol.fromJSON({
      [templatePath]: 'PROJECT_NAME=my-new-app'
    }, path.resolve(import.meta.dir, '../..'));
  });

  test('should create a simplified .env.stigmergy.example file', async () => {
    await init({ interactive: false });

    const envExamplePath = path.join(process.cwd(), '.stigmergy/.env.stigmergy.example');
    const envExampleContent = await fs.readFile(envExamplePath, 'utf8');

    expect(envExampleContent).toContain('PROJECT_NAME=my-new-app');
    expect(envExampleContent).not.toContain('GOOGLE_API_KEY');
  });
});
