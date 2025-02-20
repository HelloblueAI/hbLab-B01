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

const { TextDecoder, TextEncoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


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


require('@testing-library/jest-dom');


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


global.webkitSpeechRecognition = global.SpeechRecognition;


global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));


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
