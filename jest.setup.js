const { TextDecoder, TextEncoder } = require('util');

// Set global TextEncoder and TextDecoder for Jest environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

console.log(require.resolve('@testing-library/jest-dom/extend-expect'));
require('@testing-library/jest-dom/extend-expect');


// Mock for voice recognition functionality (if needed for your tests)
global.createMockRecognitionResult = (transcript, confidence) => ({
  results: [
    {
      isFinal: true,
      0: { transcript, confidence },
    },
  ],
});

global.mockVoiceRecognition = () => {
  const mockRecognition = {
    start: jest.fn(),
    stop: jest.fn(),
    dispatchEvent: jest.fn(), // Mock dispatchEvent for tests
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return { recognition: mockRecognition };
};

// Jest cleanup after each test
afterEach(() => {
  jest.clearAllMocks(); // Reset all mocks
  jest.resetModules(); // Reset module imports
  jest.restoreAllMocks(); // Restore original implementations
});
