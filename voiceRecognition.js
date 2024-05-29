export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {
    this.elements = elements;
    this.fetchCompanyData = this.debounce(fetchCompanyData, 300); // Debounce API calls
    this.options = {
      interimResults: options.interimResults || false,
      continuous: options.continuous || false,
      ...options
    };
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
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;
    recognition.onstart = this.handleStart.bind(this);
    recognition.onresult = this.handleResult.bind(this);
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
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ')
      .trim();
    if (event.results[0].isFinal) {
      this.elements.companySearch.value = transcript;
      this.fetchCompanyData(transcript);
      this.stopRecognition();
    }
  }

  handleEnd() {
    this.isListening = false;
    this.updateFeedback("", false);
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
    if (this.recognition) {
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
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}
