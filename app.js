// app.js
import { config } from './config';
import { capitalizeCompany, displayNotification, isValidURL, delay } from './utils';
import { login } from './auth';
import { fetchCompanyData } from './api';
import { render } from './templates';

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    voiceButton: document.getElementById('voiceButton'),
    companySearch: document.getElementById('companySearch'),
    output: document.getElementById('output'),
    loginForm: document.getElementById('loginForm'),
  };

  let activeEffect = 'intro';
  let isConfirmationDialogOpen = false;

  const typeEffect = async (text, effectType) => {
    const outputElement = elements.output.querySelector('.typed-output');
    for (let i = 0; i <= text.length; i++) {
      if (activeEffect !== effectType) break;
      outputElement.textContent = text.substring(0, i);
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
      "Got a company in mind? Just say the word or type it in",
      "Connecting to customer services has never been this fast",
      "Ready to connect?",
      "I'm here to assist...!",
    ];

    for (const sentence of sentences) {
      await typeEffect(sentence, 'intro');
      await delay(1500);
    }
    if (activeEffect === 'intro') introEffect();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = event.target.elements.email.value;
    const password = event.target.elements.password.value;
    await login(email, password);
  };

  const handleCompanySearch = async (company) => {
    if (isConfirmationDialogOpen) return;

    const cachedData = localStorage.getItem(`companyData-${company}`);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      render('companyInfo', data);
      showConfirmationDialog(data);
      return;
    }

    try {
      render('loading');
      const data = await fetchCompanyData(company);
      localStorage.setItem(`companyData-${company}`, JSON.stringify(data));
      render('companyInfo', data);
      showConfirmationDialog(data);
    } catch (error) {
      console.error('Error fetching company data:', error);
      if (!isConfirmationDialogOpen) {
        displayNotification(`Failed to fetch data for ${company}. Please try again.`);
      }
    }
  };

  const showConfirmationDialog = (data) => {
    if (isConfirmationDialogOpen) return;
    isConfirmationDialogOpen = true;

    const { company_name, phone_number, url } = data;
    if (phone_number && phone_number !== "NA") {
      const messageContent = `${company_name}: ${phone_number}. Would you like to dial this number?`;
      if (confirm(messageContent)) {
        window.location.href = isValidURL(url) ? url : `tel:${phone_number.replace(/[^0-9]/g, '')}`;
      }
    } else {
      displayNotification(`${company_name} does not have a phone number available.`);
    }

    isConfirmationDialogOpen = false;
  };

  const handleVoiceInput = async (transcript) => {
    const company = capitalizeCompany(transcript.trim());
    elements.companySearch.value = company;
    await handleCompanySearch(company);
  };

  const setupVoiceRecognition = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;

    recognition.onstart = () => {
      render('listening');
      elements.voiceButton.classList.add('active');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceInput(transcript);
    };

    recognition.onerror = (event) => {
      const errorMessage = {
        "no-speech": "No speech was detected. Please try again.",
        "aborted": "Voice recognition was aborted. Please try again.",
        "audio-capture": "Microphone is not accessible. Please ensure you've granted the necessary permissions.",
        "network": "Network issues prevented voice recognition. Please check your connection.",
        "not-allowed": "Permission to access microphone was denied. Please allow access to use this feature.",
        "service-not-allowed": "The speech recognition feature is not supported by your browser. For company searches, use your keyboard.",
      }[event.error] || "An unknown error occurred with voice recognition.";

      displayNotification(errorMessage);
    };

    recognition.onend = () => {
      render('ready');
      elements.voiceButton.classList.remove('active');
    };

    elements.voiceButton.addEventListener('click', async () => {
      if (elements.voiceButton.classList.contains('active')) {
        recognition.stop();
        return;
      }

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        displayNotification("Failed to access the microphone. Please check your browser settings and ensure you've granted the necessary permissions.");
      }
    });
  };

  elements.loginForm.addEventListener('submit', handleLogin);

  elements.companySearch.addEventListener('input', (event) => {
    event.target.value = capitalizeCompany(event.target.value.trim());
  });

  elements.companySearch.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && event.target.value.trim() !== '') {
      const company = capitalizeCompany(event.target.value.trim());
      await handleCompanySearch(company);
    }
  });

  elements.companySearch.addEventListener('focus', introEffect);

  setupVoiceRecognition();
  introEffect();
});