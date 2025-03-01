//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

export const testEnvironment = 'jsdom';
export const setupFilesAfterEnv = ['<rootDir>/jest.setup.js'];
export const transform = {
  '^.+\\.(js|jsx)$': ['babel-jest', {
    presets: [
      ['@babel/preset-env', {
        targets: { node: 'current' }
      }],
      '@babel/preset-react'
    ]
  }]
};
export const moduleNameMapper = {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
  '^@/(.*)$': '<rootDir>/src/$1',
  '^voicerecognition$': '<rootDir>/voicerecognition.js'
};
export const transformIgnorePatterns = [
  '/node_modules/(?!node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/'
];
export const moduleDirectories = ['node_modules', '<rootDir>'];
export const moduleFileExtensions = ['js', 'jsx', 'json', 'node'];
export const verbose = true;
export const testTimeout = 10000;
export const resetMocks = false;
export const resetModules = false;
export const restoreMocks = false;
