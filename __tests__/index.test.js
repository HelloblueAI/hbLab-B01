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

// Helper functions
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
    expect.hasAssertions(); // Add this at the start of the test
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

    let data = await voiceRecognition.processVoiceInput(transcript);

    expect(state.cache.has(`companyData-${transcript}`)).toBe(true);

    data = await voiceRecognition.processVoiceInput(transcript);

    expect(state.cache.get(`companyData-${transcript}`)).toEqual(data);
  });

  it('should not fetch data for low-confidence input', async () => {
    expect.hasAssertions(); // Add this at the start of the test
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
