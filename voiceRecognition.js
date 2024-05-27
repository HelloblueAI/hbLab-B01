export default class VoiceRecognition {
  constructor(elements, fetchCompanyData) {
    this.elements = elements;
    this.fetchCompanyData = fetchCompanyData;
    this.recognition = this.initSpeechRecognition();
    this.isListening = false;
    this.addEventListeners();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("This browser does not support Speech Recognition.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false; // Ensures only final results are processed
    recognition.onstart = this.handleStart.bind(this);
    recognition.onresult = this.handleResult.bind(this);
    recognition.onerror = this.handleError.bind(this);
    recognition.onend = this.handleEnd.bind(this);

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
    const transcript = event.results[0][0].transcript.trim();
    this.elements.companySearch.value = transcript;
    this.fetchCompanyData(transcript);
    this.stopRecognition();
  }

  handleError(event) {
    const errorMessage = this.getErrorMessage(event.error);
    this.updateFeedback(errorMessage, false);
    this.stopRecognition();
  }

  handleEnd() {
    this.isListening = false;
    this.updateFeedback("", false);
  }

  toggleVoiceRecognition() {
    if (this.recognition) {
      if (this.isListening) {
        this.stopRecognition();
      } else {
        this.startRecognition();
      }
    }
  }

  handleKeydown(event) {
    if (event.altKey && event.key === 'v') {
      this.toggleVoiceRecognition();
    }
  }

  startRecognition() {
    try {
      this.recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      this.updateFeedback("Error starting voice recognition. Please try again.", false);
    }
  }

  stopRecognition() {
    if (this.isListening) {
      this.recognition.stop();
    }
  }

  updateFeedback(message, isActive) {
    this.elements.feedbackText.textContent = message;
    this.elements.voiceButton.classList.toggle('active', isActive);
  }

  getErrorMessage(error) {
    const errorMessages = {
      "no-speech": "No speech was detected. Please try again.",
      "aborted": "Voice recognition was aborted. Please try again.",
      "audio-capture": "Microphone is not accessible. Please ensure you've granted the necessary permissions.",
      "network": "Network issues prevented voice recognition. Please check your connection.",
      "not-allowed": "Permission to access microphone was denied. Please allow access to use this feature.",
      "service-not-allowed": "This browser lacks speech recognition support. Use keyboard input or access helloblue.ai for full speech recognition capabilities."
    };

    return errorMessages[error] || "An error occurred with voice recognition.";
  }
}
