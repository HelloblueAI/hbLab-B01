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
      animationFrame: null,
      ripples: [],
      nextRippleId: 0
    };

    this.setupStyles();
    this.initializeRecognition();

    if (this.elements.voiceButton) {
      this.elements.voiceButton.addEventListener('click', () => {
        this.toggleVoiceRecognition();
      });
    }
  }

  setupStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .voice-button {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #f3f4f6;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .voice-button:hover {
        background: #e5e7eb;
      }

      .voice-button.listening {
        background: #4f46e5;
        box-shadow: 0 0 20px rgba(79, 70, 229, 0.5);
      }

      .voice-button svg {
        width: 28px;
        height: 28px;
        transition: all 0.3s ease;
      }

      .voice-button.listening svg {
        color: white;
      }

      .ripple {
        position: absolute;
        border: 2px solid #4f46e5;
        border-radius: 50%;
        animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      }

      .glow {
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0) 70%);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes ripple {
        0% {
          transform: scale(1);
          opacity: 0.4;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 0.2;
        }
      }

      .success-animation {
        animation: success 1s ease;
      }

      @keyframes success {
        0% {
          transform: scale(1);
          background:rgb(11, 199, 237);
        }
        50% {
          transform: scale(1.1);
          background: #3b82f6;
        }
        100% {
          transform: scale(1);
          background:rgb(111, 156, 248);
        }
      }
    `;
    document.head.appendChild(styleSheet);
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

  startMicAnimation() {
    const button = this.elements.voiceButton;
    if (!button) return;

    button.classList.add('listening');

    // Add glow effect
    const glow = document.createElement('div');
    glow.className = 'glow';
    button.appendChild(glow);

    // Start ripple animation
    const addRipple = () => {
      if (!this.isListening) return;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.width = '100%';
      ripple.style.height = '100%';
      button.appendChild(ripple);

      setTimeout(() => ripple.remove(), 2000);

      if (this.isListening) {
        setTimeout(addRipple, 2000);
      }
    };

    addRipple();

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

    // Remove all ripples and glow
    const ripples = button.querySelectorAll('.ripple');
    const glow = button.querySelector('.glow');
    ripples.forEach(ripple => ripple.remove());
    if (glow) glow.remove();

    if (this.state.animationFrame) {
      cancelAnimationFrame(this.state.animationFrame);
      this.state.animationFrame = null;
    }
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

  animateSuccess() {
    const button = this.elements.voiceButton;
    if (!button) return;

    button.classList.add('success-animation');
    setTimeout(() => {
      button.classList.remove('success-animation');
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
