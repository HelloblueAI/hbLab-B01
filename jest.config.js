module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' }
        }],
        '@babel/preset-react'
      ]
    }]
  },

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^voicerecognition$': '<rootDir>/voicerecognition.js'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/'
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 10000,
  resetMocks: false,
  resetModules: false,
  restoreMocks: false
};
