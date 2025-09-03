// ESLint configuration for Stigmergy project
module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code quality
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    
    // Complexity rules
    'complexity': ['warn', 15],
    'max-lines': ['warn', 500],
    'max-lines-per-function': ['warn', 100],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 4],
    
    // Style rules
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    
    // ES6+ rules
    'arrow-spacing': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'template-curly-spacing': 'error',
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Performance rules
    'no-loop-func': 'warn',
    'prefer-template': 'warn',
    
    // Async/await rules
    'require-atomic-updates': 'error',
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        // Relax some rules for test files
        'max-lines-per-function': 'off',
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js'
  ]
};