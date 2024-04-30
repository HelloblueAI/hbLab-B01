import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    voiceButton: document.getElementById('voiceButton'),
    companySearch: document.getElementById('companySearch'),
    typedOutput: document.getElementById('typed-output'),
    feedbackText: document.getElementById('feedbackText'),
    companyNameSpan: document.getElementById('companyName'),
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
  };

  let activeEffect = 'intro';
  let isConfirmationDialogOpen = false;
  let fetchTimeout;
  let isFetching = false;

  const typeEffect = async (text, effectType) => {
    for (let i = 0; i <= text.length; i++) {
      if (activeEffect !== effectType) break;
      elements.typedOutput.textContent = text.substring(0, i);
      await delay(text[i - 1] === '.' ? 200 : 50);
    }
  };

  const introEffect = async () => {
    activeEffect = 'intro';
    const sentences = [
      "Hello, I'm B01",
      "I broke out of the internet to help you contact any company",
      "Phone and Instant Live Chat",
      "All in under 3 seconds",
      "Got a company in mind?",
      "Just say the word or type it in",
      "Connecting to customer services has never been this fast",
      "Ready to connect?",
      "I'm here to assist!",
    ];

    for (const sentence of sentences) {
      await typeEffect(sentence, 'intro');
      await delay(1500);
    }
    if (activeEffect === 'intro') introEffect();
  };

  const fetchCompanyData = async (company) => {
    if (isConfirmationDialogOpen) return;

    elements.feedbackText.textContent = "";
    const cacheKey = `companyData-${company}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const data = JSON.parse(cachedData);
      await displayCompanyInfo(data);
      isFetching = false;
    } else {
      try {
        const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        localStorage.setItem(cacheKey, JSON.stringify(data));
        await displayCompanyInfo(data);
        isFetching = false;
      } catch (error) {
        console.error('Error fetching company data:', error);
        displayNotification(`Failed to fetch data for ${capitalizeCompany(company)}. Please try again.`);
        introEffect();
        isFetching = false;
      }
    }
  };

  const displayCompanyInfo = async ({ company_name: companyName, phone_number: phoneNumber, url }) => {
    activeEffect = 'company';
    const capitalizedCompanyName = capitalizeCompany(companyName);
    const sentence = `You asked to call: ${capitalizedCompanyName}`;
    elements.typedOutput.textContent = '';
    await typeEffect(sentence, 'company');
    showConfirmationDialog(capitalizedCompanyName, phoneNumber, url);
  };

  const showConfirmationDialog = (capitalizedCompanyName, phoneNumber, url) => {
    if (isConfirmationDialogOpen) return;
    isConfirmationDialogOpen = true;

    if (phoneNumber && phoneNumber !== "NA") {
      const messageContent = `${capitalizedCompanyName}: ${phoneNumber}. Would you like to dial this number?`;
      if (confirm(messageContent)) {
        window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
      } else {
        introEffect();
      }
    } else {
      displayNotification(`${capitalizedCompanyName} does not have a phone number available.`);
      introEffect();
    }

    isConfirmationDialogOpen = false;
  };

  let timer;
  const handleCompanySearch = async (event) => {
    clearTimeout(timer);

    if (event.type === 'keypress' && event.key === ' ') {
      event.preventDefault();
      event.target.value += ' ';
      return;
    }

    if (event.type === 'keypress' && event.key !== 'Enter') {
      return;
    }

    let company = event.target.value.trim();

    if (company !== '') {
      company = company.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      event.target.value = company;

      clearTimeout(fetchTimeout);

      if (event.key === 'Enter') {
        if (!isFetching) {
          isFetching = true;
          await fetchCompanyData(company);
        }
      } else {
        timer = setTimeout(async () => {
          if (!isFetching) {
            isFetching = true;
            await fetchCompanyData(company);
          }
        }, 1000);
      }
    } else {
      introEffect();
    }
  };

  elements.companySearch.addEventListener('input', handleCompanySearch);
  elements.companySearch.addEventListener('keypress', handleCompanySearch);

  const setupVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("This browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;

    recognition.onstart = () => {
      elements.feedbackText.textContent = "Listening...";
      elements.voiceButton.classList.add('active');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      elements.companySearch.value = transcript;
      fetchCompanyData(transcript.trim());
      recognition.stop();
    };

    recognition.onerror = (event) => {
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
          errorMessage = "The speech recognition feature is not supported by Instagram browser. For company searches, use your keyboard. Please visit helloblue.ai for the speech recognition feature.";
          break;
        default:
          break;
      }

      displayNotification(errorMessage);
    };

    recognition.onend = () => {
      elements.voiceButton.classList.remove('active');
    };

    elements.voiceButton.addEventListener('click', () => {
      if (elements.voiceButton.classList.contains('active')) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  };

  setupVoiceRecognition();
  introEffect();
});
