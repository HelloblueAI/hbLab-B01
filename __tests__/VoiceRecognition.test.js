export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;
    this.errorHandler = null;

    this.options = {
      continuous: options.continuous || false,
      interimResults: options.interimResults || false,
      autoRestart: options.autoRestart || false,
      language: 'en-US',
      confidenceThreshold: 0.6,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      animationFrame: null
    };

    this.setupStyles();
    this.initializeRecognition();
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
  }

  start() {
    this.startRecognition();
  }

  stop() {
    this.stopRecognition();
  }

  onError(handler) {
    this.errorHandler = handler;
  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.handleError({ error: 'Speech Recognition not supported.' });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.lang = this.options.language;

    this.recognition.onstart = () => this.handleStart();
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
  }

  startRecognition() {
    if (this.recognition && !this.state.isListening) {
      try {
        this.recognition.start();
        this.state.isListening = true;
        this.showFeedback('Listening...', true);
        this.startAnimation();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        this.handleError(error);
      }
    }
  }

  stopRecognition() {
    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
        this.state.isListening = false;
        this.stopAnimation();
        this.showFeedback('Click to start speaking', false);
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }

  toggleVoiceRecognition() {
    this.state.isListening ? this.stopRecognition() : this.startRecognition();
  }

  handleStart() {
    this.elements.voiceButton.classList.add('listening');
    this.showFeedback('Listening... Speak now', true);
    this.startAnimation();
  }

  handleEnd() {
    if (this.options.autoRestart && this.state.isListening) {
      setTimeout(() => this.startRecognition(), 1000);
    } else {
      this.elements.voiceButton.classList.remove('listening');
      this.showFeedback('Click to start speaking', false);
      this.stopAnimation();
    }
  }

  handleResult(event) {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim();
    const confidence = result[0].confidence;

    if (confidence > this.options.confidenceThreshold && transcript) {
      this.state.lastTranscript = transcript;
      this.processTranscript(transcript);
    }
  }

  handleError(event) {
    console.error('Voice Recognition Error:', event.error);
    this.showFeedback(`Error: ${event.error}`, false);

    if (this.errorHandler) {
      this.errorHandler(event);
    }

    if (this.options.autoRestart) {
      setTimeout(() => this.startRecognition(), 1000);
    }
  }

  processTranscript(transcript) {
    this.elements.companySearch.value = transcript;
    this.fetchCompanyData(transcript);
    this.showFeedback('Processing...', true);
  }

  startAnimation() {
    const button = this.elements.voiceButton;
    if (!button) return;

    const animate = () => {
      if (!this.state.isListening) return;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 1500);
      this.state.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  stopAnimation() {
    if (this.state.animationFrame) {
      cancelAnimationFrame(this.state.animationFrame);
      this.state.animationFrame = null;
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

  setupStyles() {
    if (document.getElementById('voice-recognition-styles')) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'voice-recognition-styles';
    styleSheet.textContent = `
      .voice-button {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #f3f4f6;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .voice-button:hover {
        background: #e5e7eb;
      }
      .voice-button.listening {
        background: #4f46e5;
        box-shadow: 0 0 20px rgba(79, 70, 229, 0.5);
      }
      .voice-button.active {
        background: #4f46e5;
      }
      .voice-button svg {
        width: 28px;
        height: 28px;
        transition: all 0.3s ease;
      }
      .voice-button.listening svg,
      .voice-button.active svg {
        color: white;
      }
      .ripple {
        position: absolute;
        border: 2px solid #4f46e5;
        border-radius: 50%;
        animation: ripple 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      @keyframes ripple {
        0% {
          transform: scale(1);
          opacity: 0.4;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}
