export default class VoiceRecognition {
  constructor(elements, fetchCompanyData) {
    this.elements = elements;
    this.fetchCompanyData = fetchCompanyData;
  }

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("This browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;

    recognition.onstart = () => {
      this.elements.feedbackText.textContent = "Listening...";
      this.elements.voiceButton.classList.add('active');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.elements.companySearch.value = transcript;
      this.fetchCompanyData(transcript.trim());
      recognition.stop();
    };

    recognition.onerror = (event) => {
      this.handleVoiceRecognitionError(event);
    };

    recognition.onend = () => {
      this.elements.voiceButton.classList.remove('active');
    };

    this.elements.voiceButton.addEventListener('click', () => {
      if (this.elements.voiceButton.classList.contains('active')) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'v') { // Pressing "Alt + V" triggers voice recognition
        this.toggleVoiceRecognition(recognition);
      }
    });
  }

  toggleVoiceRecognition(recognition) {
    if (this.elements.voiceButton.classList.contains('active')) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  handleVoiceRecognitionError(event) {
    let errorMessage = "An error occurred with voice recognition.";

    switch (event.error) {
      case "no-speech":
        errorMessage = "No speech was detected. Please try again.";
        break;
      case "aborted":
        errorMessage = "Voice recognition was aborted. Please try again.";
        break;
      case "audio-capture":
        errorMessage = "Microphone is not accessible. Please ensure you've granted the necessary permissions.";
        break;
      case "network":
        errorMessage = "Network issues prevented voice recognition. Please check your connection.";
        break;
      case "not-allowed":
        errorMessage = "Permission to access microphone was denied. Please allow access to use this feature.";
        break;
      case "service-not-allowed":
        errorMessage = "This browser lacks speech recognition support. Use keyboard input or access helloblue.ai for full speech recognition capabilities.";
        break;
      default:
        break;
    }

    displayNotification(errorMessage);
  }
}