export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.throttle(
      this.retryFetch(fetchCompanyData),
      500,
    );
    this.options = {
      interimResults: true,
      continuous: true,
      language: "en-US",
      confidenceThreshold: 0.6,
      ...options,
    };
    this.recognition = this.initSpeechRecognition();
    this.isListening = false;
    this.addEventListeners();
  }

  initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateFeedback(
        "Browser does not support Speech Recognition.",
        false,
      );
      throw new Error("This browser does not support Speech Recognition.");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.options.language;
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;
    recognition.maxAlternatives = 1;
    recognition.onstart = this.handleStart.bind(this);
    recognition.onresult = this.handleResult.bind(this);
    recognition.onend = this.handleEnd.bind(this);
    recognition.onerror = this.handleError.bind(this);

    return recognition;
  }

  addEventListeners() {
    this.elements.voiceButton.addEventListener("click", () =>
      this.toggleVoiceRecognition(),
    );
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
  }

  handleStart() {
    this.isListening = true;
    this.updateFeedback("Listening...", true);
    this.animateVoiceButton(true);
  }

  handleResult(event) {
    const interimTranscript = Array.from(event.results)
      .filter((result) => !result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(" ");

    if (interimTranscript) {
      this.elements.companySearch.value = interimTranscript; 
      this.fetchCompanyData(interimTranscript); 
    }

    const finalTranscript = Array.from(event.results)
      .filter((result) => result.isFinal)
      .map((result) => result[0].transcript.trim())
      .join(" ");

    if (finalTranscript) {
      this.elements.companySearch.value = finalTranscript;
      this.fetchCompanyData(finalTranscript)
        .then(() => this.animateDetection())
        .catch((error) => this.handleError(error));
      this.stopRecognition();
    } else if (!finalTranscript) {
      this.updateFeedback("Low confidence, please try again.", false);
    }
  }

  handleEnd() {
    this.isListening = false;
    this.updateFeedback("Click to speak", false);
    this.animateVoiceButton(false);
  }

  handleError(event) {
    const messages = {
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "Microphone needed. Check browser permissions.",
      network: "Network error. Try again later.",
      "not-allowed": "Microphone access denied. Enable it in browser settings.",
    };
    const message = messages[event.error] || `Error: ${event.error}`;
    this.updateFeedback(message, false);
  }

  toggleVoiceRecognition() {
    this.isListening ? this.stopRecognition() : this.startRecognition();
  }

  handleKeydown(event) {
    if (event.altKey && event.key === "v") {
      this.toggleVoiceRecognition();
    }
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

  updateFeedback(message, isActive) {
    this.elements.feedbackText.textContent = message;
    this.elements.voiceButton.classList.toggle("active", isActive);
    this.elements.feedbackText.style.color = isActive ? "green" : "red";
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
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

  retryFetch(fetchCompanyData, retries = 2, delay = 500) {
    return async (...args) => {
      for (let i = 0; i < retries; i++) {
        try {
          await this.withTimeout(fetchCompanyData(...args));
          return;
        } catch (error) {
          console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}`);
          if (i === retries - 1) {
            throw error;
          }
          await this.delay(delay);
        }
      }
    };
  }

  withTimeout(promise, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout")), timeout);
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  animateVoiceButton(isActive) {
    this.elements.voiceButton.classList.toggle("active", isActive);
  }

  animateDetection() {
    this.elements.voiceButton.classList.add("detected");
    setTimeout(
      () => this.elements.voiceButton.classList.remove("detected"),
      1000,
    );
  }
}
