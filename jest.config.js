const { defaults } = require('jest-config');

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|other-esm-module)/)', 
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  verbose: true,
  maxWorkers: '50%',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js', 'jsx', 'ts', 'tsx'],
};
