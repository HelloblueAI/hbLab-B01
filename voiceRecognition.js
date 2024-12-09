export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;

    this.options = {
      interimResults: true,
      continuous: true,
      language: "en-US",
      confidenceThreshold: 0.6,
      maxRetries: 3,
      autoRestart: false,
      throttleDelay: 200,
      ...options,
    };

    this.fetchCompanyData = this.throttle(
      this.retryFetch(fetchCompanyData, this.options.maxRetries),
      this.options.throttleDelay
    );

    this.isListening = false;

    this.recognition = this.initializeRecognition();

    this.setupEventListeners();
  }

  initializeRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateFeedback("Speech Recognition not supported in this browser.", false);
      throw new Error("Speech Recognition API is not available.");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = this.options.language;
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;

    recognition.onstart = () => this.onRecognitionStart();
    recognition.onresult = (event) => this.onRecognitionResult(event);
    recognition.onend = () => this.onRecognitionEnd();
    recognition.onerror = (event) => this.onRecognitionError(event);

    return recognition;
  }

  setupEventListeners() {
    const { voiceButton } = this.elements;

    voiceButton.addEventListener("click", () => this.toggleVoiceRecognition());

    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.key === "v") {
        this.toggleVoiceRecognition();
      }
    });
  }

  toggleVoiceRecognition() {
    this.isListening ? this.stopRecognition() : this.startRecognition();
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



  onRecognitionStart() {
    this.isListening = true;
    this.updateFeedback("Listening... Speak now.", true);
    this.toggleButtonAnimation(true);
  }

  onRecognitionResult(event) {
    const results = Array.from(event.results);
    const finalTranscript = results
      .filter((res) => res.isFinal)
      .map((res) => res[0].transcript.trim())
      .join(" ");
    const interimTranscript = results
      .filter((res) => !res.isFinal)
      .map((res) => res[0].transcript.trim())
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
      if (!this.options.autoRestart) {
        this.stopRecognition();
      }
    }
  }

  updateSearchInput(transcript) {
    const { companySearch } = this.elements;
    if (companySearch) {
      companySearch.value = transcript;
    }
  }

  onRecognitionEnd() {
    this.isListening = false;
    this.updateFeedback("Click to start speaking.", false);
    this.toggleButtonAnimation(false);

    if (this.options.autoRestart) {
      setTimeout(() => this.startRecognition(), 1000);
    }
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

    if (!this.options.autoRestart) {
      this.stopRecognition();
    }
  }

  updateFeedback(message, isActive) {
    const { feedbackText, voiceButton } = this.elements;
    feedbackText.textContent = message;

    if (isActive) {
      feedbackText.classList.add("active-feedback");
      voiceButton.classList.add("active");
    } else {
      feedbackText.classList.remove("active-feedback");
      voiceButton.classList.remove("active");
    }
  }

  toggleButtonAnimation(isActive) {
    this.elements.voiceButton.classList.toggle("listening", isActive);
  }

  animateSuccess() {
    const { voiceButton } = this.elements;
    voiceButton.classList.add("success");
    setTimeout(() => voiceButton.classList.remove("success"), 1000);
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
          await this.delay(300 * attempt);
        }
      }
    };
  }

  throttle(func, delay) {
    let timeoutId;
    return (...args) => {
      if (!timeoutId) {
        func(...args);
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, delay);
      }
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
