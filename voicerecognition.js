export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.throttle(
      this.retryFetch(fetchCompanyData, options.maxRetries || 3),
      500,
    );
    this.options = {
      interimResults: true,
      continuous: false, 
      language: "en-US",
      confidenceThreshold: 0.6,
      ...options,
    };
    this.isListening = false;

    this.recognition = this.initializeRecognition();
    this.setupEventListeners();
  }

  
  initializeRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.elements.feedbackText.textContent =
        "Speech Recognition not supported in this browser.";
      throw new Error("Speech Recognition API is not available.");
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
    this.elements.voiceButton.addEventListener("click", () =>
      this.toggleVoiceRecognition(),
    );

    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.key === "v") {
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
    this.updateFeedback("Listening... Speak now.", true);
    this.toggleButtonAnimation(true);
  }
  
  onRecognitionResult(event) {
    const finalTranscript = Array.from(event.results)
      .filter((result) => result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(" ");

    const interimTranscript = Array.from(event.results)
      .filter((result) => !result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(" ");

    if (interimTranscript) {
      this.updateSearchInput(interimTranscript);
    }

    if (finalTranscript) {
      this.handleFinalTranscript(finalTranscript);
    }
  }

  async handleFinalTranscript(transcript) {
    this.updateSearchInput(transcript);

    try {
      await this.fetchCompanyData(transcript);
      this.animateSuccess();
    } catch (error) {
      this.updateFeedback(`Error: ${error.message}`, false);
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
    this.updateFeedback("Click to start speaking.", false);
    this.toggleButtonAnimation(false);
  }

  onRecognitionError(event) {
    const errorMessages = {
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "Microphone is unavailable. Check permissions.",
      network: "Network error occurred. Please check your connection.",
      "not-allowed": "Microphone access denied. Enable it in browser settings.",
    };

    const message = errorMessages[event.error] || `Error: ${event.error}`;
    this.updateFeedback(message, false);
    this.stopRecognition();
  }

  
  updateFeedback(message, isActive) {
    this.elements.feedbackText.textContent = message;
    this.elements.feedbackText.style.color = isActive ? "green" : "red";
    this.elements.voiceButton.classList.toggle("active", isActive);
  }

  
  toggleButtonAnimation(isActive) {
    this.elements.voiceButton.classList.toggle("listening", isActive);
  }

  
  animateSuccess() {
    this.elements.voiceButton.classList.add("detected");
    setTimeout(() => {
      this.elements.voiceButton.classList.remove("detected");
    }, 1000);
  }

  retryFetch(fetchFunction, maxRetries) {
    return async (data) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await fetchFunction(data);
        } catch (error) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error("Maximum retry attempts reached.");
          }
          await this.delay(500 * attempt);
        }
      }
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
