module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // Use Babel for JS/JSX
  },
  transformIgnorePatterns: ['node_modules/(?!(node-fetch)/)'], // Transform ESM modules
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js', // Mock static assets
  },
  globals: {
    'ts-jest': {
      useESM: true, // Support ESM for TypeScript
    },
  },
  verbose: true,
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  coverageProvider: 'v8',
};
