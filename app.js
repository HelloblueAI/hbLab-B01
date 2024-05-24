import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay } from './utils.js';
import VoiceRecognition from './voiceRecognition.js';

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
  let isFetching = false;
  const cache = new Map();

  function setBodyHeight() {
    document.body.style.minHeight = `${window.innerHeight}px`;
  }

  window.addEventListener('resize', setBodyHeight);
  window.addEventListener('load', setBodyHeight);
  window.addEventListener('orientationchange', setBodyHeight);
  setBodyHeight();

  async function typeEffect(text, effectType) {
    for (let i = 0; i <= text.length; i++) {
      if (activeEffect !== effectType) break;
      elements.typedOutput.textContent = text.substring(0, i);
      await delay(text[i - 1] === '.' ? 200 : 50);
    }
  }

  async function introEffect() {
    activeEffect = 'intro';
    const sentences = [
      "Hello, I'm B01",
      "I broke out of the internet to help you contact any company",
      "Phone and Instant Live Chat",
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
  }

  async function displayCompanyInfo({ company_name: companyName, phone_number: phoneNumber, url }) {
    activeEffect = 'company';
    const capitalizedCompanyName = capitalizeCompany(companyName);
    const sentence = `You asked to call: ${capitalizedCompanyName}`;
    elements.typedOutput.textContent = '';
    await typeEffect(sentence, 'company');
    showConfirmationDialog(capitalizedCompanyName, phoneNumber, url);
  }

  async function fetchCompanyData(company) {
    elements.feedbackText.textContent = "";
    elements.voiceButton.classList.remove('voiceButton-listening');

    if (isConfirmationDialogOpen || isFetching) return;

    isFetching = true;
    elements.feedbackText.textContent = "";
    const cacheKey = `companyData-${company}`;
    const cachedData = cache.get(company);

    if (cachedData) {
      await displayCompanyInfo(cachedData);
      isFetching = false;
      return;
    }

    try {
      const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      cache.set(company, data);
      await displayCompanyInfo(data);
    } catch (error) {
      const errorMessage = error.message || 'An error occurred while fetching company data.';
      displayNotification(`${errorMessage} Please try again.`);
      introEffect();
    } finally {
      isFetching = false;
    }
  }

  function showConfirmationDialog(capitalizedCompanyName, phoneNumber, url) {
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
  }

  elements.companySearch.addEventListener('input', event => {
    const value = event.target.value;
    event.target.value = capitalizeCompany(value);
  });

  elements.companySearch.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      fetchCompanyData(capitalizeCompany(e.target.value));
    }
  });

  const voiceRecognition = new VoiceRecognition(elements, fetchCompanyData);
  voiceRecognition.setupVoiceRecognition();

  introEffect();
});
