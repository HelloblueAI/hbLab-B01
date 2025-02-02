export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;

    this.options = {
      continuous: true,
      language: 'en-US',
      confidenceThreshold: 0.75,
      maxRetries: 5,
      retryDelay: 500,
      noiseReduction: true,
      adaptiveThreshold: true,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      retryCount: 0,
      silenceTimeout: null
    };

    this.setupStyles();
    this.initializeRecognition();
    this.attachEventListeners();
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
        background: #4f46e5;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }
      .voice-button:hover { background: #4338ca; }
      .voice-button.listening { background: #1d4ed8; box-shadow: 0 0 20px rgba(30, 58, 138, 0.7); }
      .voice-button.detected { background: #10b981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.7); }
      .voice-button svg { width: 28px; height: 28px; transition: color 0.2s ease; }
      .voice-button.listening svg, .voice-button.detected svg { color: white; }
      @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.1; } }
    `;
    document.head.appendChild(styleSheet);
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
    this.recognition.maxAlternatives = 3;

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
    this.state.silenceTimeout = setTimeout(() => {
      if (this.state.isListening) {
        this.stopRecognition();
        this.showFeedback('No speech detected. Try again.', false);
      }
    }, 5000);
  }

  handleEnd() {
    this.state.isListening = false;
    this.showFeedback('Click to start speaking.', false);
    clearTimeout(this.state.silenceTimeout);
  }

  handleResult(event) {
    const bestResult = [...event.results[event.results.length - 1]]
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (bestResult.confidence < this.options.confidenceThreshold) {
      this.showFeedback('Low confidence. Try again.', false);
      return;
    }

    const transcript = bestResult.transcript.trim();
    if (transcript) {
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
  }

  animateCompanyDetection() {
    const button = this.elements.voiceButton;
    if (!button) return;
    button.classList.add('detected');
    setTimeout(() => button.classList.remove('detected'), 1000);
  }

  toggleVoiceRecognition() {
    this.state.isListening ? this.stopRecognition() : this.startRecognition();
  }

  startRecognition() {
    if (this.recognition && !this.state.isListening) {
      try { this.recognition.start(); }
      catch (error) { console.error('Failed to start recognition:', error); }
    }
  }

  stopRecognition() {
    if (this.recognition && this.state.isListening) {
      try { this.recognition.stop(); }
      catch (error) { console.error('Failed to stop recognition:', error); }
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
