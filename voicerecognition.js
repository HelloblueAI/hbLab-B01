export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;

    this.options = {
      continuous: true,
      language: 'en-US',
      confidenceThreshold: 0.85,
      maxRetries: 5,
      retryDelay: 250,
      noiseReduction: true,
      adaptiveThreshold: true,
      instantDisplay: true,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      retryCount: 0,
      silenceTimeout: null,
      processing: false,
      detectionTimeout: null
    };

    this.setupStyles();
    this.initializeRecognition();
    this.attachEventListeners();
  }

  setupStyles() {
    if (navigator.userAgent.includes('jsdom')) {
      console.warn('🛑 JSDOM detected - Skipping style injection.');
      return;
    }

    try {
      const styleSheet = document.createElement('style');
      styleSheet.innerText = `
        .voice-button { width: 64px; height: 64px; border-radius: 50%; background: #f3f4f6; border: none; cursor: pointer; transition: 0.3s ease; display: flex; align-items: center; justify-content: center; }
        .voice-button:hover { background: #e5e7eb; }
        .voice-button.listening, .voice-button.active { background: #4f46e5; box-shadow: 0 0 20px rgba(79, 70, 229, 0.5); }
        .ripple { position: absolute; border: 2px solid #4f46e5; border-radius: 50%; animation: ripple 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2); opacity: 0; } }
      `;
      document.head.appendChild(styleSheet);
    } catch (error) {
      console.warn('🛑 Style injection failed:', error);
    }
  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showFeedback('Speech Recognition not supported.', false);
      return;
    }

    this.recognition = new SpeechRecognition();
    this.configureRecognition();
  }

  configureRecognition() {
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = this.options.language;
    this.recognition.maxAlternatives = 5;

    this.recognition.onstart = () => this.handleStart();
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => this.handleError(event);
  }

  attachEventListeners() {
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
  }

  handleStart() {
    this.state.isListening = true;
    this.showFeedback('Listening... Speak now.', true);
    this.elements.voiceButton.classList.add('listening');
  }

  handleEnd() {
    this.state.isListening = false;
    this.showFeedback('Click to start speaking.', false);
    this.elements.voiceButton.classList.remove('listening');
    clearTimeout(this.state.silenceTimeout);
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
    if (['network', 'no-speech', 'audio-capture'].includes(event.error)) {
      if (this.state.retryCount < this.options.maxRetries) {
        this.state.retryCount++;
        setTimeout(() => this.startRecognition(), this.options.retryDelay);
      } else {
        this.showFeedback('Recognition failed. Try again.', false);
      }
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
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, false);
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
    this.state.isListening ? this.stopRecognition() : this.startRecognition();
  }

  startRecognition() {
    if (this.recognition && !this.state.isListening) {
      try {
        this.recognition.start();
        this.state.isListening = true;
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }

  stopRecognition() {
    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }

  showFeedback(message, isActive) {
    if (this.elements.feedbackText) this.elements.feedbackText.textContent = message;
    if (this.elements.voiceButton) this.elements.voiceButton.classList.toggle('active', isActive);
  }

  validateElements(elements) {
    const required = ['voiceButton', 'companySearch', 'feedbackText'];
    const missing = required.filter(key => !elements[key]);
    if (missing.length > 0) throw new Error(`Missing required elements: ${missing.join(', ')}`);
    return elements;
  }
}
