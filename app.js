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

  const setBodyHeight = () => {
    document.body.style.minHeight = `${window.innerHeight}px`;
  };

  const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  window.addEventListener('resize', throttle(setBodyHeight, 200));
  window.addEventListener('load', setBodyHeight);
  window.addEventListener('orientationchange', setBodyHeight);
  setBodyHeight();

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

  const displayCompanyInfo = async ({ company_name: companyName, phone_number: phoneNumber, url }) => {
    activeEffect = 'company';
    const capitalizedCompanyName = capitalizeCompany(companyName);
    const sentence = `You asked to call: ${capitalizedCompanyName}`;
    elements.typedOutput.textContent = '';
    await typeEffect(sentence, 'company');
    showConfirmationDialog(capitalizedCompanyName, phoneNumber, url);
  };

  const fetchCompanyData = async (company) => {
    if (isConfirmationDialogOpen || isFetching) return;

    isFetching = true;
    elements.feedbackText.textContent = "";
    elements.voiceButton.classList.remove('voiceButton-listening');

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
      displayNotification(`${error.message || 'An error occurred while fetching company data.'} Please try again.`);
      introEffect();
    } finally {
      isFetching = false;
    }
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

  const debounce = (func, delay) => {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  };

  elements.companySearch.addEventListener('input', debounce(event => {
    event.target.value = capitalizeCompany(event.target.value);
  }, 300));

  elements.companySearch.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      fetchCompanyData(capitalizeCompany(event.target.value));
    }
  });

  const voiceRecognition = new VoiceRecognition(elements, fetchCompanyData);
  voiceRecognition.setupVoiceRecognition();

  introEffect();
});
