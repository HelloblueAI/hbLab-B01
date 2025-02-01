export default class VoiceRecognition {
  constructor(elements, fetchCompanyData, options = {}) {

    this.elements = this.validateElements(elements);
    this.fetchCompanyData = fetchCompanyData;

    this.options = {
      continuous: false,
      language: 'en-US',
      confidenceThreshold: 0.6,
      maxRetries: 3,
      ...options
    };

    this.state = {
      isListening: false,
      lastTranscript: '',
      animationFrame: null
    };


    this.initializeRecognition();


    if (this.elements.voiceButton) {
      this.elements.voiceButton.addEventListener('click', () => {
        this.toggleVoiceRecognition();
      });
    }


  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.showFeedback('Speech Recognition not supported in this browser.', false);
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = this.options.language;


    this.recognition.onstart = () => {
      this.isListening = true;
      this.showFeedback('Listening... Speak now.', true);
      this.startMicAnimation();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.showFeedback('Click to start speaking.', false);
      this.stopMicAnimation();
    };

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const finalResults = results.filter(result => result.isFinal);


      if (finalResults.length > 0) {
        const transcript = finalResults[finalResults.length - 1][0].transcript.trim();
        if (transcript) {
          this.stopRecognition();
          this.handleFinalTranscript(transcript);
        }
      }
    };

    this.recognition.onerror = (event) => {
      this.showFeedback(`Error: ${event.error}`, false);
      this.stopRecognition();
    };
  }

  toggleVoiceRecognition() {
    if (this.isListening) {
      this.stopRecognition();
    } else {
      this.startRecognition();
    }
  }

  startRecognition() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }

  stopRecognition() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.stopMicAnimation();
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }

  async handleFinalTranscript(transcript) {
    if (this.elements.companySearch) {
      this.elements.companySearch.value = transcript;
    }



    try {
      await this.fetchCompanyData(transcript);
      this.animateSuccess();
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, false);

    }
  }

  startMicAnimation() {
    const button = this.elements.voiceButton;
    if (!button) return;

    button.classList.add('listening');

    let scale = 1;
    let growing = true;

    const animate = () => {
      if (!this.isListening) return;

      if (growing) {
        scale += 0.01;
        if (scale >= 1.1) growing = false;
      } else {
        scale -= 0.01;
        if (scale <= 1) growing = true;
      }

      button.style.transform = `scale(${scale})`;
      this.state.animationFrame = requestAnimationFrame(animate);
    };

    this.state.animationFrame = requestAnimationFrame(animate);
  }

  stopMicAnimation() {
    const button = this.elements.voiceButton;
    if (!button) return;

    button.classList.remove('listening');
    button.style.transform = 'scale(1)';

    if (this.state.animationFrame) {
      cancelAnimationFrame(this.state.animationFrame);
      this.state.animationFrame = null;
    }
  }

  animateSuccess() {
    const button = this.elements.voiceButton;
    if (!button) return;

    button.classList.add('success');
    setTimeout(() => {
      button.classList.remove('success');
    }, 1000);
  }

  showFeedback(message, isActive) {
    if (this.elements.feedbackText) {
      this.elements.feedbackText.textContent = message;
    }


    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.toggle('active', isActive);
    }
  }

  validateElements(elements) {
    const required = ['voiceButton', 'companySearch', 'feedbackText'];
    const missing = required.filter(key => !elements[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required elements: ${missing.join(', ')}`);
    }
    return elements;
  }
}
