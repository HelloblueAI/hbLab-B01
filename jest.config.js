const { defaults } = require('jest-config');

module.exports = {
  // Specify the test environment
  testEnvironment: 'jsdom',

  // Setup files executed before each test suite
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Ignore paths for tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Enable coverage collection and specify output directory and formats
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'], // Added HTML for better browser visualization
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}', // Source files to collect coverage from
    '!src/**/*.d.ts', // Exclude type definitions
    '!src/**/__mocks__/**', // Exclude mock files
    '!src/**/index.{js,ts}', // Exclude barrel files
    '!src/setupTests.js', // Exclude test setup files
  ],

  // Patterns for test file matching
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).[tj]s?(x)',
    '**/tests/**/*.{js,jsx,ts,tsx}',
  ],

  // Babel transformations
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },

  // Ignore patterns for transformations
  transformIgnorePatterns: ['node_modules/(?!(node-fetch|other-esm-module)/)'],

  // Mock configurations for assets and styles
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS files
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js', // Mock static assets
  },

  // Globals for specific configurations
  globals: {
    'ts-jest': {
      isolatedModules: true, // Speed up TypeScript testing
    },
  },

  // Verbose test output for better logging
  verbose: true,

  // Optimize worker usage for CI/CD
  maxWorkers: '50%', // Use half of the available CPUs

  // Extend module file extensions
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js', 'jsx', 'ts', 'tsx'],

  // Reset configurations after each test
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,

  // Use faster coverage provider
  coverageProvider: 'v8',
};
