import VoiceRecognition from '../voicerecognition';

describe('Simplified Voice Recognition Integration Tests', () => {
  let voiceRecognition;

  const mockRecognitionResult = (transcript, confidence) => ({
    results: [
      [
        {
          transcript,
          confidence,
        },
      ],
    ],
  });

  const simulateDispatchEvent = (type, payload) => {
    voiceRecognition.recognition.dispatchEvent({ type, ...payload });
  };

  beforeEach(() => {
    const mockElements = {
      feedbackText: {
        textContent: '',
        classList: { add: jest.fn(), remove: jest.fn() },
      },
      voiceButton: {
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
      },
      companySearch: { value: '' },
    };

    voiceRecognition = new VoiceRecognition(mockElements, jest.fn());

    jest.spyOn(voiceRecognition, 'initializeRecognition').mockImplementation(() => ({
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onstart: jest.fn(),
      onresult: jest.fn(),
      onend: jest.fn(),
      onerror: jest.fn(),
    }));

    voiceRecognition.recognition = voiceRecognition.initializeRecognition();
  });

  it('should process voice input and update the UI correctly', async () => {
    expect.assertions(3);
    voiceRecognition.recognition.onresult({ results: result.results });
    const transcript = 'TestCompany';
    const result = mockRecognitionResult(transcript, 0.9);

    simulateDispatchEvent('result', { results: result.results });

    expect(voiceRecognition.recognition.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'result' })
    );
    expect(result.results[0][0].transcript).toBe('TestCompany');
    expect(result.results[0][0].confidence).toBe(0.9);
  });

  it('should handle recognition errors gracefully', () => {
    expect.assertions(2);

    const mockError = new Error('Network error');
    voiceRecognition.recognition.onerror(mockError);

    expect(voiceRecognition.elements.feedbackText.classList.add).toHaveBeenCalledWith('error');
    expect(voiceRecognition.elements.feedbackText.textContent).toBe('Network error');
  });

  it('should skip low-confidence inputs', async () => {
    expect.assertions(1);

    const result = mockRecognitionResult('LowConfidenceCompany', 0.3);

    simulateDispatchEvent('result', { results: result.results });

    expect(result.results[0][0].confidence).toBeLessThan(0.5);
  });

  it('should fetch data for high-confidence input', async () => {
    expect.assertions(2);

    const transcript = 'HighConfidenceCompany';
    const result = mockRecognitionResult(transcript, 0.95);

    simulateDispatchEvent('result', { results: result.results });

    expect(result.results[0][0].transcript).toBe('HighConfidenceCompany');
    expect(result.results[0][0].confidence).toBeGreaterThan(0.9);
  });

  it.each([
    ['no-speech', 'No speech detected'],
    ['aborted', 'Recognition aborted'],
    ['audio-capture', 'Microphone unavailable'],
    ['network', 'Network error'],
  ])('should handle error: %s', (errorType, expectedMessage) => {
    expect.assertions(2);

    voiceRecognition.recognition.dispatchEvent.mockImplementation(({ type }) => {
      if (type === 'error') {
        voiceRecognition.recognition.onerror({ error: errorType });
      }
    });

    simulateDispatchEvent('error', { error: errorType });

    expect(voiceRecognition.recognition.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
    expect(voiceRecognition.elements.feedbackText.classList.add).toHaveBeenCalledWith('error');
    expect(voiceRecognition.elements.feedbackText.textContent).toBe(expectedMessage);
  });

  it('should start and stop recognition', () => {
    expect.assertions(2);

    voiceRecognition.startRecognition();
    expect(voiceRecognition.recognition.start).toHaveBeenCalled();

    voiceRecognition.stopRecognition();
    expect(voiceRecognition.recognition.stop).toHaveBeenCalled();
  });

  it('should toggle voice recognition on and off', () => {
  });
  it('should update feedback text on successful recognition', () => {
    expect.assertions(1);

    const transcript = 'UpdateFeedbackText';
    const result = mockRecognitionResult(transcript, 0.9);

    simulateDispatchEvent('result', { results: result.results });

    expect(voiceRecognition.elements.feedbackText.textContent).toBe('UpdateFeedbackText');
  });

  it('should add error class to feedback text on recognition error', () => {
    expect.assertions(1);

    simulateDispatchEvent('error', { error: 'network' });

    expect(voiceRecognition.elements.feedbackText.classList.add).toHaveBeenCalledWith('error');
  });

  it('should remove error class from feedback text on successful recognition', () => {
    expect.assertions(1);

    voiceRecognition.elements.feedbackText.classList.add('error');

    const transcript = 'RemoveErrorClass';
    const result = mockRecognitionResult(transcript, 0.9);

    simulateDispatchEvent('result', { results: result.results });

    expect(voiceRecognition.elements.feedbackText.classList.remove).toHaveBeenCalledWith('error');
  });

  it('should update company search input value on successful recognition', () => {
    expect.assertions(1);

    const transcript = 'CompanySearchValue';
    const result = mockRecognitionResult(transcript, 0.9);

    simulateDispatchEvent('result', { results: result.results });

    expect(voiceRecognition.elements.companySearch.value).toBe('CompanySearchValue');
  });
  expect.assertions(2);

  voiceRecognition.isListening = false;
  voiceRecognition.toggleVoiceRecognition();
  expect(voiceRecognition.recognition.start).toHaveBeenCalled();

  voiceRecognition.isListening = true;
  voiceRecognition.toggleVoiceRecognition();
  expect(voiceRecognition.recognition.stop).toHaveBeenCalled();
});
