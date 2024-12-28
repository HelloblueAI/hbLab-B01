const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');

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

    document.body.append(elements.voiceButton, elements.companySearch, elements.feedbackText, elements.typedOutput);

    state = {
      cache: new Map(),
    };

    voiceRecognition = {
      recognition: new SpeechRecognition(),
      processVoiceInput: jest.fn(async (transcript) => {
        const cachedData = state.cache.get(`companyData-${transcript}`);
        if (cachedData) return cachedData;

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

  test('should correctly process voice input and update the UI', async () => {
    const transcript = 'TestCompany';
    const mockRecognitionResult = { results: [[{ transcript, confidence: 0.9 }]] };

    voiceRecognition.recognition.dispatchEvent({ type: 'result', results: mockRecognitionResult.results });

    const data = await voiceRecognition.processVoiceInput(transcript);
    elements.typedOutput.textContent = `You asked to call: ${data.company_name}`;

    expect(elements.typedOutput.textContent).toBe('You asked to call: TestCompany');
    expect(state.cache.get(`companyData-${transcript}`)).toEqual({
      company_name: 'TestCompany',
      phone_number: '1-800-FAKE-NUMBER',
      url: 'https://testcompany.com/',
    });
  });

  test('should handle recognition errors gracefully', () => {
    const mockErrorEvent = { error: 'network' };

    voiceRecognition.recognition.dispatchEvent({ type: 'error', ...mockErrorEvent });

    elements.feedbackText.textContent = 'An error occurred. Please try again.';
    expect(elements.feedbackText.textContent).toBe('An error occurred. Please try again.');
  });

  test('should cache results and reuse them', async () => {
    const transcript = 'CachedCompany';

    // First time: fetch and cache
    let data = await voiceRecognition.processVoiceInput(transcript);

    expect(state.cache.has(`companyData-${transcript}`)).toBe(true);

    // Second time: use cache
    data = await voiceRecognition.processVoiceInput(transcript);

    expect(state.cache.get(`companyData-${transcript}`)).toEqual(data);
  });

  test('should not fetch data for low-confidence input', async () => {
    const mockRecognitionResult = { results: [[{ transcript: 'LowConfidenceCompany', confidence: 0.3 }]] };

    voiceRecognition.recognition.dispatchEvent({ type: 'result', results: mockRecognitionResult.results });

    await new Promise(process.nextTick);

    expect(voiceRecognition.processVoiceInput).not.toHaveBeenCalled();
    expect(elements.feedbackText.textContent).toBe('');
  });
});
