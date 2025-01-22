const { TextDecoder, TextEncoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Include testing library
require('@testing-library/jest-dom');

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

global.SpeechRecognition = jest.fn().mockImplementation(() => {
  const handlers = {};

  return {
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn((type, handler) => {
      if (!handlers[type]) {
        handlers[type] = [];
      }
      handlers[type].push(handler);
    }),
    removeEventListener: jest.fn((type, handler) => {
      if (handlers[type]) {
        handlers[type] = handlers[type].filter((h) => h !== handler);
      }
    }),
    dispatchEvent: jest.fn((event) => {
      const eventHandlers = handlers[event.type];
      if (eventHandlers) {
        eventHandlers.forEach((handler) => handler(event));
      }
    }),
    onstart: jest.fn(),
    onresult: jest.fn(),
    onend: jest.fn(),
    onerror: jest.fn(),
  };
});

// Mock document.createElement for DOM elements
global.document.createElement = jest.fn(() => ({
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
  },
  textContent: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  style: {},
  appendChild: jest.fn(),
  setAttribute: jest.fn(),
}));
