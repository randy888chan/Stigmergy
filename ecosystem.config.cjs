module.exports = {
  apps: [
    {
      name: 'stigmergy-mock',
      script: './engine/main.js',
      interpreter: 'bun',
      out_file: './.logs/stigmergy-mock.log',
      error_file: './.logs/stigmergy-mock.log',
      // All test-specific environment variables go here
      env_test: {
        NODE_ENV: 'test',
        USE_MOCK_AI: 'true',
        STIGMERGY_PORT: 3011,
        OPENROUTER_API_KEY: 'mock-key',
        OPENROUTER_BASE_URL: 'http://localhost/mock',
      },
    },
  ],
};
