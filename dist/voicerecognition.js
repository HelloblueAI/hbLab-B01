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
export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;

    this.options = {
      continuous: false,
      language: 'en-US',
      confidenceThreshold: 0.85,
      maxRetries: 5,
      retryDelay: 250,
      noiseReduction: true,
      adaptiveThreshold: true,
      instantDisplay: true,
      autoStopTimeout: 5000,
      debounceDelay: 300,
      maxDuration: 30000,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      retryCount: 0,
      processing: false,
      detectionTimeout: null
    };

    this.setupStyles();
    this.initializeRecognition();
    this.attachEventListeners();
  }

  setupStyles() {
    if (navigator.userAgent.includes('jsdom')) return;

    try {
      const styleSheet = document.createElement('style');
      styleSheet.innerText = `
        .voice-button {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .voice-button:hover {
          background: #e5e7eb;
          transform: scale(1.05);
        }
        .voice-button.listening,
        .voice-button.voiceButton-listening {
          background: #4f46e5;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.5);
        }
        .voice-button.detected {
          background: #059669;
          transform: scale(1.1);
        }
        .voice-button.error {
          background: #dc2626;
          animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `;
      document.head.appendChild(styleSheet);
    } catch (error) {
      console.warn('Style injection failed:', error);
    }
  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showFeedback('Speech Recognition not supported.', false);
      return;
    }

    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = this.options.language;


    this.recognition.onstart = () => this.handleStart();
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
  }

  attachEventListeners() {
    if (!this.elements.voiceButton) return;

    this.elements.voiceButton.addEventListener('click', () => {
      this.toggleVoiceRecognition();
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'space') {
        e.preventDefault();
        this.toggleVoiceRecognition();
      }
    });
  }

  handleStart() {
    this.state.isListening = true;
    this.showFeedback('Listening... Speak now.', true);
    this.elements.voiceButton.classList.add('voiceButton-listening');
  }

  handleEnd() {
    this.state.isListening = false;
    this.showFeedback('Click to start speaking.', false);
    this.elements.voiceButton.classList.remove('voiceButton-listening');
  }

  handleResult(event) {
    if (this.state.processing) return;

    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript.trim();
      } else if (this.options.instantDisplay) {
        this.elements.companySearch.value = event.results[i][0].transcript.trim();
      }
    }

    if (transcript) {
      this.state.processing = true;
      this.stopRecognition();
      this.processTranscript(transcript);
    }
  }

  handleError(event) {
    console.error('Voice Recognition Error:', event.error);

    if (['network', 'no-speech', 'audio-capture'].includes(event.error) &&
        this.state.retryCount < this.options.maxRetries) {
      this.state.retryCount++;
      setTimeout(() => this.startRecognition(), this.options.retryDelay);
    } else {
      this.showFeedback(`Error: ${event.error}`, false);
    }

    this.stopRecognition();
    this.state.processing = false;
  }

  async processTranscript(transcript) {
    this.elements.companySearch.value = transcript;

    try {
      await this.fetchCompanyData(transcript);
      this.showFeedback('Company detected!', true);
      this.animateCompanyDetection();


      this.stopRecognition();
      this.elements.voiceButton.classList.remove('listening', 'voiceButton-listening');
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, false);
      this.elements.voiceButton.classList.add('error');
      setTimeout(() => {
        this.elements.voiceButton.classList.remove('error');
      }, 1000);
    }

    this.state.processing = false;
  }

  animateCompanyDetection() {
    const button = this.elements.voiceButton;
    button.classList.remove('listening');
    button.classList.add('detected');

    clearTimeout(this.state.detectionTimeout);
    this.state.detectionTimeout = setTimeout(() => {
      button.classList.remove('detected');
    }, 1000);
  }

  toggleVoiceRecognition() {
    if (this.state.isListening) {
      this.stopRecognition();
    } else {
      this.startRecognition();
    }
  }

  startRecognition() {
    if (!this.recognition || this.state.isListening) return;

    try {
      this.recognition.start();
      this.state.isListening = true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }

  stopRecognition() {
    if (!this.recognition || !this.state.isListening) return;

    try {
      this.recognition.stop();
      this.state.isListening = false;
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }

  showFeedback(message, isActive) {
    if (this.elements.feedbackText) {
      this.elements.feedbackText.textContent = message;
    }

    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.toggle('active', isActive);
    }
  }

  validateElements(elements) {
    const required = ['voiceButton', 'companySearch', 'feedbackText'];
    const missing = required.filter(key => !elements[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required elements: ${missing.join(', ')}`);
    }
    return elements;
  }


  start() {

    console.log('Manual start requested but ignored - use button click instead');
  }

  stop() {
    this.stopRecognition();
  }

  onError(handler) {
    this.errorHandler = handler;
  }
}
