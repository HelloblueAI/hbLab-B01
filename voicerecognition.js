export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.retryFetch(fetchCompanyData, options.maxRetries || 3);
    this.options = {
      continuous: false,
      language: 'en-US',
      confidenceThreshold: 0.6,
      ...options,
    };

    this.isListening = false;

    try {
      this.recognition = this.initializeRecognition();
    } catch (error) {
      console.error('Speech Recognition API Initialization Error:', error.message);
      this.recognition = null;
    }

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
    if (this.elements.voiceButton) {
      this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecognition());
    }

    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'v') {
        this.toggleVoiceRecognition();
      }
    });
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

  toggleVoiceRecognition() {
    if (this.recognition) {
      this.isListening ? this.stopRecognition() : this.startRecognition();
    } else {
      this.showFeedback('Speech Recognition is not available.', false);
    }
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

    let finalTranscript = filteredResults
      .map((result) => result[0].transcript.trim())
      .join(' ');

    const interimTranscript = Array.from(event.results)
      .filter((result) => !result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(' ');

    if (interimTranscript) {
      this.updateSearchInput(interimTranscript);
    }

    if (finalTranscript && finalTranscript.trim() !== '') {
      finalTranscript = this.deduplicateWords(finalTranscript);
      this.handleFinalTranscript(finalTranscript);
      this.animateDetection();
    }
  }

  async handleFinalTranscript(transcript) {
    this.updateSearchInput(transcript);


    if (this.lastProcessedTranscript === transcript) {
      console.log('Duplicate request avoided:', transcript);
      return;
    }

    this.lastProcessedTranscript = transcript;

    try {
      await this.fetchCompanyData(transcript);
      this.animateSuccess();
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, false);
    } finally {
      this.stopRecognition();
    }
  }

  deduplicateWords(input) {

    return input
      .split(' ')
      .filter((word, index, arr) => word !== arr[index - 1])
      .join(' ');
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
      network: 'Network error. Check your connection.',
      'not-allowed': 'Microphone access denied. Update browser settings.',
    };

    this.showFeedback(errorMessages[event.error] || `Error: ${event.error}`, false);
    this.stopRecognition();
  }

  showFeedback(message, isActive) {
    const { feedbackText, voiceButton } = this.elements;
    if (feedbackText) {
      feedbackText.textContent = message;
    }

    if (isActive) {
      if (feedbackText) {
        feedbackText.classList.add('active');
      }
      if (voiceButton) {
        voiceButton.classList.add('active');
      }
    } else {
      if (feedbackText) {
        feedbackText.classList.remove('active');
      }
      if (voiceButton) {
        voiceButton.classList.remove('active');
      }
    }
  }

  toggleButtonState(isActive) {
    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.toggle('listening', isActive);
    }
  }

  animateSuccess() {
    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.add('success');
      setTimeout(() => this.elements.voiceButton.classList.remove('success'), 1000);
    }
  }

  animateDetection() {
    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.add('detected');
      setTimeout(() => this.elements.voiceButton.classList.remove('detected'), 1000);
    }
  }

  retryFetch(fetchFunction, maxRetries) {
    return async (data) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await fetchFunction(data);
        } catch (error) {
          console.warn(`Retrying (${attempt + 1}/${maxRetries}):`, error.message);
          attempt++;
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
