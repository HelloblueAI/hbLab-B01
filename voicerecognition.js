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
    this.errorHandler = null;
    
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
      interimResults: true,
      autoRestart: false,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      retryCount: 0,
      processing: false,
      detectionTimeout: null,
      recognitionActive: false,
      autoRestartTimeout: null
    };

    this.setupStyles();
    this.initializeRecognition();
    this.attachEventListeners();
  }

  setupStyles() {
    if (navigator.userAgent.includes('jsdom') || typeof document === 'undefined') return;

    try {

      if (document.getElementById('voice-recognition-styles')) return;

      const styleSheet = document.createElement('style');
      styleSheet.id = 'voice-recognition-styles';
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
          overflow: hidden;
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
        .voice-button:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .voice-button:active:after {
          opacity: 1;
        }
        .voice-button.listening:before {
          content: '';
          position: absolute;
          width: 80%;
          height: 80%;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.7);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 0.7; }
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
      this.showFeedback('Speech Recognition not supported in this browser.', false);
      this.triggerErrorHandler({
        error: 'browser-unsupported',
        message: 'Speech Recognition not supported in this browser.'
      });
      return;
    }

    try {
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;
      this.recognition.lang = this.options.language;

      this.recognition.onstart = () => this.handleStart();
      this.recognition.onend = () => this.handleEnd();
      this.recognition.onresult = (event) => this.handleResult(event);
      this.recognition.onerror = (event) => this.handleError(event);


      if (this.options.maxDuration > 0) {
        this.maxDurationTimer = null;
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.showFeedback('Failed to initialize speech recognition.', false);
      this.triggerErrorHandler({
        error: 'initialization-failed',
        message: error.message || 'Failed to initialize speech recognition.'
      });
    }
  }

  attachEventListeners() {
    if (!this.elements.voiceButton) return;


    const newButton = this.elements.voiceButton.cloneNode(true);
    this.elements.voiceButton.parentNode.replaceChild(newButton, this.elements.voiceButton);
    this.elements.voiceButton = newButton;

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
    this.state.recognitionActive = true;
    this.showFeedback('Listening... Speak now.', true);

    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.add('voiceButton-listening', 'listening');
    }

    if (this.options.maxDuration > 0) {
      this.maxDurationTimer = setTimeout(() => {
        if (this.state.isListening) {
          this.showFeedback('Maximum listening time reached.', false);
          this.stopRecognition();
        }
      }, this.options.maxDuration);
    }
  }

  handleEnd() {
    this.state.isListening = false;
    this.state.recognitionActive = false;


    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    this.showFeedback('Click to start speaking.', false);
    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.remove('voiceButton-listening', 'listening');
    }

    if (this.state.autoRestartTimeout) {
      clearTimeout(this.state.autoRestartTimeout);
      this.state.autoRestartTimeout = null;
    }
  }

  handleResult(event) {
    if (this.state.processing) return;

    try {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;


      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const currentTranscript = result[0].transcript.trim();

        if (result.isFinal) {
          finalTranscript += currentTranscript;
          maxConfidence = Math.max(maxConfidence, result[0].confidence);
        } else {
          interimTranscript += currentTranscript;


          if (this.options.instantDisplay && this.elements.companySearch) {
            this.elements.companySearch.value = currentTranscript;
          }
        }
      }


      if (finalTranscript && (!this.options.confidenceThreshold || maxConfidence >= this.options.confidenceThreshold)) {
        this.state.processing = true;
        this.state.lastTranscript = finalTranscript;
        this.stopRecognition();
        this.processTranscript(finalTranscript);
      } else if (finalTranscript) {

        console.log(`Low confidence transcript (${maxConfidence.toFixed(2)}): "${finalTranscript}"`);
      }
    } catch (error) {
      console.error('Error handling recognition result:', error);
      this.state.processing = false;
    }
  }

  handleError(event) {
    console.error('Voice Recognition Error:', event.error);

    const isTryableError = ['network', 'no-speech', 'audio-capture', 'aborted'].includes(event.error);


    if (isTryableError && this.state.retryCount < this.options.maxRetries) {
      this.state.retryCount++;
      this.showFeedback(`Retrying... (${this.state.retryCount}/${this.options.maxRetries})`, false);

      setTimeout(() => {
        if (!this.state.manualStop) {
          this.startRecognition();
        }
      }, this.options.retryDelay * this.state.retryCount);// Exponential backoff
    } else {

      this.showFeedback(`Error: ${this.getErrorMessage(event.error)}`, false);
      this.triggerErrorHandler({
        error: event.error,
        message: this.getErrorMessage(event.error)
      });


      if (this.elements.voiceButton) {
        this.elements.voiceButton.classList.add('error');
        setTimeout(() => {
          this.elements.voiceButton.classList.remove('error');
        }, 1000);
      }
    }

    this.stopRecognition();
    this.state.processing = false;


    setTimeout(() => {
      this.state.retryCount = 0;
    }, 5000);
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not available or permission denied.',
      'not-allowed': 'Microphone permission denied. Please enable it in your browser settings.',
      'network': 'Network error. Check your connection and try again.',
      'aborted': 'Recognition aborted.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Recognition grammar error.',
      'language-not-supported': 'Selected language not supported.'
    };

    return errorMessages[errorCode] || `Recognition error: ${errorCode}`;
  }

  async processTranscript(transcript) {
    if (!transcript || !this.elements.companySearch) return;


    this.elements.companySearch.value = transcript;

    try {

      this.showFeedback('Processing...', true);


      if (this.elements.voiceButton) {
        this.elements.voiceButton.classList.add('detected');
        setTimeout(() => {
          this.elements.voiceButton.classList.remove('detected');
        }, 1000);
      }


      await this.fetchCompanyData(transcript);

      this.showFeedback('Company detected!', true);
      this.animateCompanyDetection();


      this.state.manualStop = true;


      if (this.state.autoRestartTimeout) {
        clearTimeout(this.state.autoRestartTimeout);
        this.state.autoRestartTimeout = null;
      }
    } catch (error) {
      this.showFeedback(`Error: ${error.message || 'Failed to process company data'}`, false);

      if (this.elements.voiceButton) {
        this.elements.voiceButton.classList.add('error');
        setTimeout(() => {
          this.elements.voiceButton.classList.remove('error');
        }, 1000);
      }

      this.triggerErrorHandler({
        error: 'process-error',
        message: error.message || 'Failed to process company data',
        transcript
      });
    } finally {
      this.state.processing = false;


      this.stopRecognition();
    }
  }

  animateCompanyDetection() {
    if (!this.elements.voiceButton) return;

    const button = this.elements.voiceButton;
    button.classList.remove('listening', 'voiceButton-listening');
    button.classList.add('detected');

    clearTimeout(this.state.detectionTimeout);
    this.state.detectionTimeout = setTimeout(() => {
      button.classList.remove('detected');
    }, 1000);
  }

  toggleVoiceRecognition() {
    if (this.state.isListening) {
      this.state.manualStop = true;
      this.stopRecognition();
    } else {
      this.state.manualStop = false;
      this.startRecognition();
    }
  }

  startRecognition() {
    if (!this.recognition || this.state.isListening || this.state.recognitionActive) return;

    try {
      this.recognition.start();
      this.state.isListening = true;
      this.state.recognitionActive = true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.triggerErrorHandler({
        error: 'start-failed',
        message: error.message || 'Failed to start voice recognition'
      });
    }
  }

  stopRecognition() {
    if (!this.recognition || (!this.state.isListening && !this.state.recognitionActive)) return;

    try {
      this.recognition.stop();
      this.state.isListening = false;


      if (this.maxDurationTimer) {
        clearTimeout(this.maxDurationTimer);
        this.maxDurationTimer = null;
      }
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }

  showFeedback(message, isActive) {
    if (this.elements.feedbackText) {
      this.elements.feedbackText.textContent = message;
    }

    if (this.elements.voiceButton) {
      if (isActive) {
        this.elements.voiceButton.classList.add('active');
      } else {
        this.elements.voiceButton.classList.remove('active');
      }
    }
  }

  validateElements(elements) {
    const required = ['voiceButton', 'companySearch'];
    const missing = required.filter(key => !elements[key]);

    if (missing.length > 0) {
      const error = `Missing required elements: ${missing.join(', ')}`;
      console.error(error);
      throw new Error(error);
    }


    if (!elements.feedbackText) {
      console.warn('feedbackText element not provided. Feedback messages will not be displayed.');
    }

    return elements;
  }


  start() {

    console.log('Manual start requested but ignored - use button click instead');
    return this;
  }

  stop() {
    this.state.manualStop = true;
    this.stopRecognition();
    return this;
  }

  reset() {
    this.stop();
    this.state = {
      isListening: false,
      lastTranscript: '',
      retryCount: 0,
      processing: false,
      detectionTimeout: null,
      recognitionActive: false,
      autoRestartTimeout: null,
      manualStop: false
    };

    if (this.elements.companySearch) {
      this.elements.companySearch.value = '';
    }

    if (this.elements.feedbackText) {
      this.elements.feedbackText.textContent = '';
    }

    return this;
  }

  onError(handler) {
    if (typeof handler === 'function') {
      this.errorHandler = handler;
    }
    return this;
  }

  triggerErrorHandler(error) {
    if (this.errorHandler && typeof this.errorHandler === 'function') {
      this.errorHandler(error);
    }
  }


  updateOptions(newOptions = {}) {
    const needsRestart = this.state.isListening &&
                         (newOptions.continuous !== undefined && newOptions.continuous !== this.options.continuous ||
                          newOptions.language !== undefined && newOptions.language !== this.options.language ||
                          newOptions.interimResults !== undefined && newOptions.interimResults !== this.options.interimResults);


    this.options = {
      ...this.options,
      ...newOptions
    };


    if (needsRestart) {
      this.stopRecognition();


      if (this.recognition) {
        this.recognition.continuous = this.options.continuous;
        this.recognition.interimResults = this.options.interimResults;
        this.recognition.lang = this.options.language;
      }


      setTimeout(() => {
        this.startRecognition();
      }, 100);
    }

    return this;
  }
}
