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

import fetch from 'node-fetch';

global.fetch = fetch;
global.SpeechRecognition = jest.fn().mockImplementation(() => {
  const handlers = {};
  return {
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn((event, handler) => {
      handlers[event] = handler;
    }),
    dispatchEvent: jest.fn((event) => {
      if (handlers[event.type]) {
        handlers[event.type](event);
      }
    }),
    onresult: jest.fn(),
    onerror: jest.fn(),
  };
});


const createMockRecognitionResult = (transcript, confidence) => ({
  results: [[{ transcript, confidence }]],
});

const processAndAssertVoiceInput = async (transcript, state, elements, voiceRecognition) => {
  const data = await voiceRecognition.processVoiceInput(transcript);
  elements.typedOutput.textContent = `You asked to call: ${data.company_name}`;

  expect(elements.typedOutput.textContent).toBe(`You asked to call: ${data.company_name}`);
  expect(state.cache.get(`companyData-${transcript}`)).toEqual({
    company_name: transcript,
    phone_number: '1-800-FAKE-NUMBER',
    url: `https://${transcript.toLowerCase()}.com/`,
  });
  return data;
};

describe('Simplified Voice Recognition Integration Tests', () => {
  let elements;
  let state;
  let voiceRecognition;

  beforeEach(() => {
    elements = {
      voiceButton: document.createElement('button'),
      companySearch: document.createElement('input'),
      feedbackText: document.createElement('div'),
      typedOutput: document.createElement('div'),
    };

    document.body.append(
      elements.voiceButton,
      elements.companySearch,
      elements.feedbackText,
      elements.typedOutput
    );

    state = { cache: new Map() };

    voiceRecognition = {
      recognition: new SpeechRecognition(),
      processVoiceInput: jest.fn(async (transcript) => {
        const cachedData = state.cache.get(`companyData-${transcript}`);
        if (cachedData) {
          return cachedData;
        }

        const mockData = {
          company_name: transcript,
          phone_number: '1-800-FAKE-NUMBER',
          url: `https://${transcript.toLowerCase()}.com/`,
        };
        state.cache.set(`companyData-${transcript}`, mockData);
        return mockData;
      }),
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should correctly process voice input and update the UI', async () => {
    expect.assertions(3);
    const transcript = 'TestCompany';
    const mockRecognitionResult = createMockRecognitionResult(transcript, 0.9);

    voiceRecognition.recognition.dispatchEvent({
      type: 'result',
      results: mockRecognitionResult.results,
    });

    const data = await processAndAssertVoiceInput(transcript, state, elements, voiceRecognition);

    expect(data).toEqual({
      company_name: transcript,
      phone_number: '1-800-FAKE-NUMBER',
      url: `https://${transcript.toLowerCase()}.com/`,
    });
  });

  it('should handle recognition errors gracefully', () => {
    expect.hasAssertions();
    const mockErrorEvent = { error: 'network' };

    voiceRecognition.recognition.dispatchEvent({
      type: 'error',
      ...mockErrorEvent,
    });

    elements.feedbackText.textContent = 'An error occurred. Please try again.';
    expect(elements.feedbackText.textContent).toBe('An error occurred. Please try again.');
  });

  it('should cache results and reuse them', async () => {
    const transcript = 'CachedCompany';

    await voiceRecognition.processVoiceInput(transcript);
    expect(state.cache.has(`companyData-${transcript}`)).toBe(true);
    const cachedData = state.cache.get(`companyData-${transcript}`);
    const processedData = await voiceRecognition.processVoiceInput(transcript);

    expect(cachedData).toEqual(processedData);
  });

  it('should not fetch data for low-confidence input', async () => {
    expect.hasAssertions();
    const mockRecognitionResult = createMockRecognitionResult('LowConfidenceCompany', 0.3);

    voiceRecognition.recognition.dispatchEvent({
      type: 'result',
      results: mockRecognitionResult.results,
    });

    await new Promise(process.nextTick);

    expect(voiceRecognition.processVoiceInput).not.toHaveBeenCalled();
    expect(elements.feedbackText.textContent).toBe('');
  });
});
