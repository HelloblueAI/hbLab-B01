const { defaults } = require('jest-config');

module.exports = {
  // Specify the test environment
  testEnvironment: 'jest-environment-jsdom',

  // Files to run before tests are executed (setup files)
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Ignore patterns for test paths
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Enable coverage collection and specify the output directory and format
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'], // Added 'html' for easier viewing in browsers
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}', // Collect coverage from source files
    '!src/**/*.d.ts',          // Exclude type definition files
    '!src/**/__mocks__/**',    // Exclude mock files
    '!src/**/index.{js,ts}',   // Exclude barrel files
  ],

  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).[tj]s?(x)',
    '**/tests/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}', 
    '!**/node_modules/**',
    '!**/dist/**',
  ],



  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|other-esm-module)/)',
  ],


  // Mocks for static assets and styles
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS files
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js', // Mock static assets
  },

  // Global variables for specific Jest configurations
  globals: {
    'ts-jest': {
      isolatedModules: true, // Improve TypeScript test performance
    },
  },

  // Enable verbose test output
  verbose: true, // No trailing comma here

  // Optimize worker usage for CI/CD environments
  maxWorkers: '50%', // Use half of the available CPUs

  // Extend recognized file extensions for modules
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js', 'jsx', 'ts', 'tsx'],

  // Reset mocks, modules, and timers after each test to ensure isolation
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,

    coverageProvider: 'v8', // Faster coverage calculation using V
  }
