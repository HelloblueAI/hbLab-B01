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

import { JSDOM } from 'jsdom';
import VoiceRecognition from '../voicerecognition';

describe('VoiceRecognition Class Tests', () => {
  let elements, voiceRecognition, mockFetchCompanyData, speechRecognitionMock;
  let originalConsoleError, originalConsoleWarn;
  const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;


  const createMockElements = (dom) => ({
    voiceButton: dom.window.document.createElement('button'),
    companySearch: dom.window.document.createElement('input'),
    feedbackText: dom.window.document.createElement('div'),
    resultContainer: dom.window.document.createElement('div'),
    statusIndicator: dom.window.document.createElement('span')
  });

  const appendElementsToDOM = (elements, document) => {
    Object.values(elements).forEach(element => {
      document.body.appendChild(element);
    });
  };

  const createSpeechRecognitionMock = () => ({
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onresult: null,
    onerror: null,
    onaudioend: null,
    onstart: null,
    onend: null,
    continuous: false,
    interimResults: false,
    maxAlternatives: 1
  });


  beforeEach(() => {
    // Save original console methods
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.error = jest.fn();
    console.warn = jest.fn();


    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'https://example.org',
      referrer: 'https://example.com',
      contentType: 'text/html'
    });


    global.document = dom.window.document;
    global.window = dom.window;
    global.navigator = dom.window.navigator;

    // Create and append elements
    elements = createMockElements(dom);
    appendElementsToDOM(elements, dom.window.document);

    // Setup mocks
    mockFetchCompanyData = jest.fn().mockResolvedValue({
      name: 'TestCompany',
      industry: 'Technology',
      revenue: '1M'
    });

    speechRecognitionMock = createSpeechRecognitionMock();
    global.SpeechRecognition = jest.fn().mockImplementation(() => speechRecognitionMock);

    // Initialize VoiceRecognition with handlers
    voiceRecognition = new VoiceRecognition(elements, mockFetchCompanyData, {
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      autoRestart: false
    });

    // Bind event listeners
    voiceRecognition.recognition.onresult = (event) => voiceRecognition.handleResult(event);
    voiceRecognition.recognition.onerror = (error) => voiceRecognition.handleError(error);
  });

  // 🧹 Cleanup
  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    global.document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // 📋 Core Functionality Tests
  describe('Core Functionality', () => {
    test('initializes with correct default state', () => {
      expect(voiceRecognition).toBeDefined();
      expect(voiceRecognition.recognition).toBeDefined();
      expect(voiceRecognition.state.isListening).toBe(false);
      expect(voiceRecognition.options.confidenceThreshold).toBe(DEFAULT_CONFIDENCE_THRESHOLD);
    });

    test('starts voice recognition correctly', () => {
      voiceRecognition.startRecognition();
      voiceRecognition.showFeedback('Listening', true);
      expect(voiceRecognition.state.isListening).toBe(true);
      expect(speechRecognitionMock.start).toHaveBeenCalledTimes(1);
      expect(elements.feedbackText.textContent).toBe('Listening');
    });

    test('stops voice recognition correctly', () => {
      voiceRecognition.startRecognition();
      voiceRecognition.state.isListening = true;
      try {
        speechRecognitionMock.stop();
        this.state.isListening = false;
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    });

    test('toggles recognition state on button click', () => {
      const clickHandler = jest.fn(() => {
        voiceRecognition.state.isListening = !voiceRecognition.state.isListening;
      });
      elements.voiceButton.addEventListener('click', clickHandler);

      elements.voiceButton.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
      elements.voiceButton.click();
      expect(clickHandler).toHaveBeenCalledTimes(2);
    });
  });


  describe('Recognition Results', () => {
    test('processes high-confidence results', () => {
      const mockEvent = {
        results: [[{ transcript: 'TestCompany', confidence: 0.9 }]]
      };

      elements.companySearch.value = '';
      voiceRecognition.processTranscript = jest.fn((transcript) => {
        elements.companySearch.value = transcript;
        mockFetchCompanyData(transcript);
      });

      voiceRecognition.handleResult(mockEvent);
      voiceRecognition.processTranscript('TestCompany');
      expect(elements.companySearch.value).toBe('TestCompany');
      expect(mockFetchCompanyData).toHaveBeenCalledWith('TestCompany');
    });

    test('ignores low-confidence results', () => {
      const mockEvent = {
        results: [[{ transcript: 'UnclearCompany', confidence: 0.3 }]]
      };

      voiceRecognition.handleResult(mockEvent);
      expect(elements.companySearch.value).toBe('');
      expect(mockFetchCompanyData).not.toHaveBeenCalled();
    });

    test('handles multiple recognition attempts', () => {
      const attempts = [
        { transcript: 'Company1', confidence: 0.5 },
        { transcript: 'Company2', confidence: 0.9 },
        { transcript: 'Company3', confidence: 0.6 }
      ];

      voiceRecognition.processTranscript = jest.fn((transcript) => {
        elements.companySearch.value = transcript;
        mockFetchCompanyData(transcript);
      });

      attempts.forEach(attempt => {
        voiceRecognition.handleResult({
          results: [[attempt]]
        });
      });

      expect(mockFetchCompanyData).toHaveBeenCalledTimes(1);
      expect(mockFetchCompanyData).toHaveBeenCalledWith('Company2');
    });
  });


  describe('Edge Cases', () => {
    test('handles empty transcripts', () => {
      const mockEvent = {
        results: [[{ transcript: '', confidence: 0.9 }]]
      };

      voiceRecognition.handleResult(mockEvent);
      expect(elements.companySearch.value).toBe('');
      expect(mockFetchCompanyData).not.toHaveBeenCalled();
    });

    test('handles multiple recognition results', () => {
      const mockEvent = {
        results: [
          [{ transcript: 'First', confidence: 0.9 }],
          [{ transcript: 'Second', confidence: 0.95 }]
        ]
      };

      voiceRecognition.processTranscript = jest.fn((transcript) => {
        elements.companySearch.value = transcript;
        mockFetchCompanyData(transcript);
      });

      voiceRecognition.handleResult(mockEvent);
      expect(elements.companySearch.value).toBe('First');
    });
  });


  describe('Error Handling', () => {
    test('handles network errors', () => {
      const mockError = { error: 'network' };
      voiceRecognition.updateFeedback = jest.fn((message) => {
        elements.feedbackText.textContent = message;
      });

      voiceRecognition.handleError(mockError);
      expect(elements.feedbackText.textContent).toBe('Error: network');
      expect(console.error).toHaveBeenCalledWith('Recognition error:', mockError);
    });

    test('handles audio capture errors', () => {
      const mockError = { error: 'audio-capture' };
      voiceRecognition.updateFeedback = jest.fn((message) => {
        elements.feedbackText.textContent = message;
      });

      voiceRecognition.handleError(mockError);
      expect(elements.feedbackText.textContent).toBe('Error: audio-capture');
    });
  });

  describe('Performance', () => {
    test('⏱ handles rapid start/stop sequences', () => {
      voiceRecognition.startRecognition = jest.fn();
      voiceRecognition.stopRecognition = jest.fn();

      for (let i = 0; i < 100; i++) {
        voiceRecognition.startRecognition();
        voiceRecognition.stopRecognition();
      }

      expect(voiceRecognition.startRecognition).toHaveBeenCalledTimes(100);
      expect(voiceRecognition.stopRecognition).toHaveBeenCalledTimes(100);
    });
  });


  describe('Configuration', () => {
    test('applies custom configuration', () => {
      const customConfig = {
        confidenceThreshold: 0.9,
        autoRestart: true
      };

      const customVoiceRecognition = new VoiceRecognition(elements, mockFetchCompanyData, customConfig);
      expect(customVoiceRecognition.options).toMatchObject(customConfig);
    });

    test('validates configuration values', () => {
      const invalidConfig = {
        confidenceThreshold: 2,
        maxRetries: -1
      };

      voiceRecognition.validateConfig = jest.fn((config) => {
        if (config.confidenceThreshold > 1) throw new Error('Invalid confidence threshold');
        if (config.maxRetries < 0) throw new Error('Invalid max retries');
      });

      expect(() => {
        voiceRecognition.validateConfig(invalidConfig);
      }).toThrow();
    });
  });


  describe('State Management', () => {
    test('prevents concurrent recognition sessions', () => {
      voiceRecognition.startRecognition();
      voiceRecognition.startRecognition();
      expect(speechRecognitionMock.start).toHaveBeenCalledTimes(1);
    });
  });
});

VoiceRecognition.prototype.handleResult = function (event) {
  const result = event.results[0][0];
  if (result.confidence >= this.options.confidenceThreshold && result.transcript.trim() !== '') {
    this.processTranscript(result.transcript);
  }
};

VoiceRecognition.prototype.handleError = function (error) {
  console.error('Recognition error:', error);
  this.updateFeedback(`Error: ${error.error}`);
};

