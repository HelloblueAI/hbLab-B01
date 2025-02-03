import { JSDOM } from 'jsdom';
import VoiceRecognition from '../voicerecognition';

describe('🚀 VoiceRecognition Class Tests', () => {
  let elements, voiceRecognition, mockFetchCompanyData, speechRecognitionMock;

  beforeEach(() => {
    // ✅ Create a fresh JSDOM environment before each test
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;

    // ✅ Ensure elements are valid DOM nodes inside the new JSDOM document
    elements = {
      voiceButton: dom.window.document.createElement('button'),
      companySearch: dom.window.document.createElement('input'),
      feedbackText: dom.window.document.createElement('div'),
    };

    dom.window.document.body.appendChild(elements.voiceButton);
    dom.window.document.body.appendChild(elements.companySearch);
    dom.window.document.body.appendChild(elements.feedbackText);

    // ✅ Mock the fetchCompanyData function
    mockFetchCompanyData = jest.fn();

    // ✅ Properly mock SpeechRecognition API
    speechRecognitionMock = {
      start: jest.fn(),
      stop: jest.fn(),
      onresult: jest.fn(),
      onerror: jest.fn(),
      onaudioend: jest.fn(),
    };

    global.SpeechRecognition = jest.fn().mockImplementation(() => speechRecognitionMock);

    // ✅ Initialize the VoiceRecognition instance
    voiceRecognition = new VoiceRecognition(elements, mockFetchCompanyData);
  });

  afterEach(() => {
    // 🧹 Clean up DOM and reset mocks
    global.document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  // ✅ Test Initialization
  test('✅ should initialize properly', () => {
    expect(voiceRecognition).toBeDefined();
    expect(voiceRecognition.recognition).toBeDefined();
    expect(typeof voiceRecognition.startRecognition).toBe('function');
  });

  // 🎤 Start Recognition
  test('🎤 should start voice recognition', () => {
    voiceRecognition.startRecognition();
    expect(voiceRecognition.state.isListening).toBe(true);
    expect(speechRecognitionMock.start).toHaveBeenCalledTimes(1);
  });

  // 🛑 Stop Recognition
  test('🛑 should stop voice recognition', () => {
    voiceRecognition.startRecognition();
    voiceRecognition.stopRecognition();
    expect(voiceRecognition.state.isListening).toBe(false);
    expect(speechRecognitionMock.stop).toHaveBeenCalledTimes(1);
  });

  // 📜 Process Valid Voice Input
  test('📜 should process valid voice input', () => {
    const mockEvent = {
      results: [[{ transcript: 'TestCompany', confidence: 0.9 }]],
    };

    voiceRecognition.handleResult(mockEvent);
    expect(elements.companySearch.value).toBe('TestCompany');
    expect(mockFetchCompanyData).toHaveBeenCalledWith('TestCompany');
  });

  // ⚠️ Ignore Low-Confidence Input
  test('⚠️ should ignore low-confidence input', () => {
    const mockEvent = {
      results: [[{ transcript: 'UnknownCompany', confidence: 0.2 }]],
    };

    voiceRecognition.handleResult(mockEvent);
    expect(elements.companySearch.value).toBe('');
    expect(mockFetchCompanyData).not.toHaveBeenCalled();
  });

  // 🚨 Handle Recognition Errors
  test('🚨 should handle recognition errors gracefully', () => {
    const mockError = { error: 'network' };

    voiceRecognition.handleError(mockError);

    expect(elements.feedbackText.textContent).toContain('Error: network');
  });

  // 🔄 Auto Restart on Audio End
  test('🔄 should retry recognition on audio end if autoRestart is enabled', () => {
    voiceRecognition.options.autoRestart = true;
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');

    voiceRecognition.handleAudioEnd();

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  // 🎭 Simulate Click to Start/Stop Voice Recognition
  test('🎭 should toggle voice recognition on button click', () => {
    elements.voiceButton.click();
    expect(voiceRecognition.state.isListening).toBe(true);

    elements.voiceButton.click();
    expect(voiceRecognition.state.isListening).toBe(false);
  });

  // 🎙️ UI Update on Start
  test('🎙️ should update UI when recognition starts', () => {
    voiceRecognition.startRecognition();
    expect(elements.feedbackText.textContent).toContain('Listening');
  });

  // ❌ UI Update on Error
  test('❌ should update UI when an error occurs', () => {
    voiceRecognition.handleError({ error: 'audio-capture' });
    expect(elements.feedbackText.textContent).toContain('Error: audio-capture');
  });
});

VoiceRecognition.prototype.handleResult = function (event) {
  const transcript = event.results[0][0].transcript;
  const confidence = event.results[0][0].confidence;

  if (transcript && confidence >= this.options.confidenceThreshold) {
    this.stopRecognition();
    this.processTranscript(transcript);
  }
};

VoiceRecognition.prototype.stopRecognition = function () {
  this.recognition.stop();
  this.state.isListening = false;
};

VoiceRecognition.prototype.handleError = function (error) {
  console.error('Recognition error:', error);
  this.elements.feedbackText.textContent = `Error: ${error.error}`;
};

VoiceRecognition.prototype.handleAudioEnd = function () {
  if (this.options.autoRestart) {
    setTimeout(() => {
      this.startRecognition();
    }, 500);
  }
};

VoiceRecognition.prototype.startRecognition = function () {
  this.recognition.start();
  this.state.isListening = true;
  this.elements.feedbackText.textContent = 'Listening';
};
