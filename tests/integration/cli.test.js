// Note the imports are from "bun:test"
import { test, expect, beforeEach, mock, describe } from 'bun:test';
import { vol } from 'memfs';
import path from 'path';

// THE BUN WAY: Mock the module and define its exports.
mock.module('fs-extra', () => {
  const memfs = require('memfs'); // Use require here for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: memfs.fs.exists.bind(null),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
        pathExists: memfs.fs.exists.bind(null),
    }
  };
});
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
