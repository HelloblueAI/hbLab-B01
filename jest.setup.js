const { TextDecoder, TextEncoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch instead of using node-fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer()),
    formData: () => Promise.resolve(new FormData()),
  })
);

// Include testing library
require('@testing-library/jest-dom');

// Mock SpeechRecognition
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

// Mock window.webkitSpeechRecognition as fallback
global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock document.createElement
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
