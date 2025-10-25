import '@happy-dom/global-registrator';

// Setup script that runs before each test file
// Sets a global configuration variable that points to the temporary .stigmergy-core directory

// Set the global test configuration
global.testConfig = {
  stigmergyCoreDir: '.stigmergy-core-test',
  isTestEnvironment: true
};

// You can also set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.STIGMERGY_CORE_DIR = '.stigmergy-core-test';