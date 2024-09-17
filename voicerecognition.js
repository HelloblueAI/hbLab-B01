export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.debounce(this.retryFetch(fetchCompanyData), 300);
    this.options = {
      interimResults: false,
      continuous: false,
      language: 'en-US', // default language
      confidenceThreshold: 0.5, // confidence threshold for recognition results
      ...options,
    };
    this.recognition = this.initSpeechRecognition();
    this.isListening = false;
    this.addEventListeners();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("This browser does not support Speech Recognition.");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.options.language;
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;
    recognition.onstart = this.handleStart.bind(this);
    recognition.onresult = this.handleResult.bind(this);
    recognition.onend = this.handleEnd.bind(this);
    recognition.onerror = this.handleError.bind(this);

    return recognition;
  }

  addEventListeners() {
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  handleStart() {
    this.isListening = true;
    this.updateFeedback("Listening...", true);
  }

  handleResult(event) {
    const transcript = Array.from(event.results)
      .map(result => ({
        transcript: result[0].transcript.trim(),
        confidence: result[0].confidence,
      }))
      .filter(result => result.confidence >= this.options.confidenceThreshold)
      .map(result => result.transcript)
      .join(' ');

    if (transcript && event.results[0].isFinal) {
      this.elements.companySearch.value = transcript;
      this.fetchCompanyData(transcript).catch(error => this.handleError(error));
      this.stopRecognition();
    } else if (!transcript) {
      this.updateFeedback("Unrecognized or low confidence speech, please try again.", false);
    }
  }

  handleEnd() {
    this.isListening = false;
    this.updateFeedback("", false);
  }

  handleError(event) {
    let message;
    switch (event.error) {
      case 'no-speech':
        message = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        message = 'Microphone access is needed to use speech recognition.';
        break;
      case 'network':
        message = 'Network error. Check your connection and try again.';
        break;
      case 'not-allowed':
        message = 'Permission denied to use microphone.';
        break;
      default:
        message = `An unknown error occurred: ${event.error}`;
    }
    console.error("Speech Recognition Error:", event.error);
    this.updateFeedback(message, false);
  }

  toggleVoiceRecognition() {
    if (this.recognition) {
      this.isListening ? this.stopRecognition() : this.startRecognition();
    }
  }

  handleKeydown(event) {
    if (event.altKey && event.key === 'v') {
      this.toggleVoiceRecognition();
    }
  }

  startRecognition() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
    }
  }

  stopRecognition() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  updateFeedback(message, isActive) {
    this.elements.feedbackText.textContent = message;
    this.elements.voiceButton.classList.toggle('active', isActive);
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  retryFetch(fetchCompanyData, retries = 3, delay = 1000) {
    return async (...args) => {
      for (let i = 0; i < retries; i++) {
        try {
          await this.withTimeout(fetchCompanyData(...args));
          return;
        } catch (error) {
          console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}`);
          if (i === retries - 1) throw error;
          await this.delay(delay);
        }
      }
    };
  }

  withTimeout(promise, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
      promise.then(resolve).catch(reject).finally(() => clearTimeout(timer));
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setLanguage(language) {
    this.recognition.lang = language;
  }
}
