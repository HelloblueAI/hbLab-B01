export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;
    this.errorHandler = null;

    this.options = {
      continuous: options.continuous ?? true, // Ensure seamless experience
      interimResults: options.interimResults ?? true, // Enable real-time updates
      autoRestart: options.autoRestart ?? true,
      language: options.language || 'en-US',
      confidenceThreshold: options.confidenceThreshold ?? 0.6,
      noiseSuppression: options.noiseSuppression ?? true,
      enhancedSpeechModel: options.enhancedSpeechModel ?? true,
      multiLingualSupport: options.multiLingualSupport ?? ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      animationFrame: null,
    };

    this.setupStyles();
    this.initializeRecognition();
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
  }


  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return this.handleError({ error: 'Speech Recognition not supported.' });

    this.recognition = new SpeechRecognition();
    Object.assign(this.recognition, {
      continuous: this.options.continuous,
      interimResults: this.options.interimResults,
      lang: this.options.language,
    });

    this.recognition.onstart = this.handleStart.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onaudioend = this.handleAudioEnd.bind(this);
  }

  setLanguage(lang) {
    if (this.options.multiLingualSupport.includes(lang)) {
      this.recognition.lang = lang;
      console.log(`Language switched to: ${lang}`);
    } else {
      console.warn(`Language ${lang} is not supported.`);
    }
  }

  startRecognition() {
    if (this.recognition && !this.state.isListening) {
      try {
        this.recognition.start();
        this.state.isListening = true;
        this.updateUI('Listening...', true);
        this.startAnimation();
      } catch (error) {

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
        this.updateUI('Click to start speaking', false);
      } catch (error) {
        this.handleError(error);
      }
    }
  }

  toggleVoiceRecognition() {
    this.state.isListening ? this.stopRecognition() : this.startRecognition();
  }

  handleStart() {
    this.elements.voiceButton.classList.add('listening');
    this.updateUI('Listening... Speak now', true);
    this.startAnimation();
  }

  handleEnd() {
    if (this.options.autoRestart && this.state.isListening) {
      setTimeout(() => this.startRecognition(), 500);
    } else {
      this.elements.voiceButton.classList.remove('listening');
      this.updateUI('Click to start speaking', false);
      this.stopAnimation();
    }
  }

  handleResult(event) {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim();
    const confidence = result[0].confidence;

    if (confidence > this.options.confidenceThreshold && transcript) {
      this.state.lastTranscript = transcript;
      this.debouncedProcessTranscript(transcript);
    }
  }

  handleError(event) {
    console.error('Voice Recognition Error:', event.error);
    this.updateUI(`Error: ${event.error}`, false);
    if (this.errorHandler) this.errorHandler(event);
    if (this.options.autoRestart) setTimeout(() => this.startRecognition(), 500);
  }

  handleAudioEnd() {
    console.log('Audio ended. Restarting recognition...');
    if (this.options.autoRestart && this.state.isListening) {
      setTimeout(() => this.startRecognition(), 500);
    }
  }

  debouncedProcessTranscript = this.debounce((transcript) => {
    this.elements.companySearch.value = transcript;
    this.fetchCompanyData(transcript);
    this.updateUI('Processing...', true);
  }, 200);

  debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  startAnimation() {
    const button = this.elements.voiceButton;
    if (!button) return;

    const animate = () => {
      if (!this.state.isListening) return;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);


      
      this.state.animationFrame = requestAnimationFrame(animate);
    };

    this.state.animationFrame = requestAnimationFrame(animate);
  }

  stopAnimation() {
    cancelAnimationFrame(this.state.animationFrame);
    this.state.animationFrame = null;
  }

  updateUI(message, isActive) {
    if (this.elements.feedbackText) this.elements.feedbackText.textContent = message;
    this.elements.voiceButton?.classList.toggle('active', isActive);
  }

  validateElements(elements) {
    const required = ['voiceButton', 'companySearch', 'feedbackText'];
    const missing = required.filter(key => !elements[key]);
    if (missing.length) throw new Error(`Missing required elements: ${missing.join(', ')}`);
    return elements;
  }

  setupStyles() {
    if (document.getElementById('voice-recognition-styles')) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'voice-recognition-styles';
    styleSheet.textContent = `
      .voice-button { width: 64px; height: 64px; border-radius: 50%; background: #f3f4f6; border: none; cursor: pointer; transition: 0.3s ease; display: flex; align-items: center; justify-content: center; }
      .voice-button:hover { background: #e5e7eb; }
      .voice-button.listening, .voice-button.active { background: #4f46e5; box-shadow: 0 0 20px rgba(79, 70, 229, 0.5); }
      .ripple { position: absolute; border: 2px solid #4f46e5; border-radius: 50%; animation: ripple 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2); opacity: 0; } }
    `;
    document.head.appendChild(styleSheet);
  }
}
