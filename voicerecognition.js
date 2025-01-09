export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.debounce(
      this.retryFetch(fetchCompanyData, options.maxRetries || 3),
      300
    );
    this.options = {
      interimResults: true,
      continuous: false,
      language: 'en-US',
      confidenceThreshold: 0.6,
      ...options,
    };

    this.isListening = false;
    this.recognition = this.initializeRecognition();

    this.setupEventListeners();
  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.showFeedback('Speech Recognition not supported in this browser.', false);
      throw new Error('Speech Recognition API is not available.');
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.options.language;
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;

    recognition.onstart = this.onRecognitionStart.bind(this);
    recognition.onresult = this.onRecognitionResult.bind(this);
    recognition.onend = this.onRecognitionEnd.bind(this);
    recognition.onerror = this.onRecognitionError.bind(this);

    return recognition;
  }

  setupEventListeners() {
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());

    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'v') {
        this.toggleVoiceRecognition();
      }
    });
  }

  startRecognition() {
    if (!this.isListening) {
      this.recognition.start();
    }
  }

  stopRecognition() {
    if (this.isListening) {
      this.recognition.stop();
    }
  }

  toggleVoiceRecognition() {
    this.isListening ? this.stopRecognition() : this.startRecognition();
  }

  onRecognitionStart() {
    this.isListening = true;
    this.showFeedback('Listening... Speak now.', true);
    this.toggleButtonState(true);
  }

  onRecognitionResult(event) {
    const filteredResults = Array.from(event.results).filter(
      (result) => result.isFinal && result[0].confidence >= this.options.confidenceThreshold
    );

    const finalTranscript = filteredResults.map((result) => result[0].transcript.trim()).join(' ');

    const interimTranscript = Array.from(event.results)
      .filter((result) => !result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(' ');

    if (interimTranscript) {
      this.updateSearchInput(interimTranscript);
    }

    if (finalTranscript) {
      this.handleFinalTranscript(finalTranscript);
      this.animateDetection(); // Add glowing effect on detection
    }
  }

  async handleFinalTranscript(transcript) {
    this.updateSearchInput(transcript);

    try {
      this.fetchCompanyData(transcript);
      this.animateSuccess();
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, false);
    } finally {
      this.stopRecognition();
    }
  }

  updateSearchInput(transcript) {
    if (this.elements.companySearch) {
      this.elements.companySearch.value = transcript;
    }
  }

  onRecognitionEnd() {
    this.isListening = false;
    this.showFeedback('Click to start speaking.', false);
    this.toggleButtonState(false);
  }

  onRecognitionError(event) {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone unavailable. Check permissions.',
      'network': 'Network error. Check your connection.',
      'not-allowed': 'Microphone access denied. Update browser settings.',
    };

    this.showFeedback(errorMessages[event.error] || `Error: ${event.error}`, false);
    this.stopRecognition();
  }

  showFeedback(message, isActive) {
    const { feedbackText, voiceButton } = this.elements;
    feedbackText.textContent = message;

    if (isActive) {
      feedbackText.classList.add('active');
      voiceButton.classList.add('active');
    } else {
      feedbackText.classList.remove('active');
      voiceButton.classList.remove('active');
    }
  }

  toggleButtonState(isActive) {
    this.elements.voiceButton.classList.toggle('listening', isActive);
  }

  animateSuccess() {
    const { voiceButton } = this.elements;
    voiceButton.classList.add('success');
    setTimeout(() => voiceButton.classList.remove('success'), 1000);
  }

  animateDetection() {
    const { voiceButton } = this.elements;
    voiceButton.classList.add('detected'); // Add detection effect
    setTimeout(() => voiceButton.classList.remove('detected'), 1000);
  }

  retryFetch(fetchFunction, maxRetries) {
    return async (data) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await fetchFunction(data);
        } catch {
          attempt++; // 'error' was unused; just omit it
          if (attempt >= maxRetries) {
            throw new Error('Maximum retry attempts reached.');
          }
          await this.delay(300 * attempt);
        }
      }
    };
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
