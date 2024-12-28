module.exports = {
  // Specifies the test environment
  testEnvironment: 'jest-environment-jsdom',

  // Setup files to include before each test suite runs
  setupFilesAfterEnv: ['./jest.setup.js'],

  // Directories to ignore for tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Enables test coverage collection and output
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts', // Exclude TypeScript declaration files
    '!src/index.js', // Exclude entry point if necessary
  ],

  // Test file patterns to match
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // Babel transformation for JavaScript/TypeScript files
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },

  // Module file extensions for importing
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // Mapping to handle CSS, images, or non-JS modules in tests
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js', // Mock images
  },

  // Custom transformation ignore patterns for node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(module-to-transform|another-module)/)', // Whitelist specific node_modules
  ],

  // Enables verbose test output
  verbose: true,
};
