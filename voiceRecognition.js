export default class VoiceRecognition {
  constructor(elements, fetchCompanyData) {
    this.elements = elements;
    this.fetchCompanyData = fetchCompanyData;
    this.recognition = this.initSpeechRecognition();
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
    recognition.onstart = this.handleStart.bind(this);
    recognition.onresult = this.handleResult.bind(this);
    recognition.onerror = this.handleError.bind(this);
    recognition.onend = this.handleEnd.bind(this);

    return recognition;
  }

  addEventListeners() {
    this.elements.voiceButton.addEventListener('click', this.toggleVoiceRecognition.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  handleStart() {
    this.elements.feedbackText.textContent = "Listening...";
    this.elements.voiceButton.classList.add('active');
  }

  handleResult(event) {
    const transcript = event.results[0][0].transcript.trim();
    this.elements.companySearch.value = transcript;
    this.fetchCompanyData(transcript);
    this.recognition.stop();
  }

  handleError(event) {
    const errorMessage = this.getErrorMessage(event.error);
    displayNotification(errorMessage); // Assuming displayNotification is globally available
  }

  handleEnd() {
    this.elements.voiceButton.classList.remove('active');
  }

  toggleVoiceRecognition() {
    if (this.recognition) {
      if (this.elements.voiceButton.classList.contains('active')) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    }
  }

  handleKeydown(event) {
    if (event.altKey && event.key === 'v') {
      this.toggleVoiceRecognition();
    }
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