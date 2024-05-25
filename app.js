import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay } from './utils.js';
import VoiceRecognition from './voiceRecognition.js';

document.addEventListener('DOMContentLoaded', init);

function init() {
  const elements = getDOMElements();
  const state = getInitialState();
  setupEventListeners(elements, state);
  setInitialBodyHeight();
  introEffect(elements, state);
}

function getDOMElements() {
  return {
    voiceButton: document.getElementById('voiceButton'),
    companySearch: document.getElementById('companySearch'),
    typedOutput: document.getElementById('typed-output'),
    feedbackText: document.getElementById('feedbackText'),
    companyNameSpan: document.getElementById('companyName'),
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
  };
}

function getInitialState() {
  return {
    activeEffect: 'intro',
    isConfirmationDialogOpen: false,
    isFetching: false,
    cache: new Map(),
  };
}

function setupEventListeners(elements, state) {
  window.addEventListener('resize', setBodyHeight);
  window.addEventListener('load', setBodyHeight);
  window.addEventListener('orientationchange', setBodyHeight);

  elements.companySearch.addEventListener('input', handleCompanySearchInput);
  elements.companySearch.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      fetchCompanyData(capitalizeCompany(e.target.value), elements, state);
    }
  });

  const voiceRecognition = new VoiceRecognition(elements, company => fetchCompanyData(company, elements, state));
  voiceRecognition.setupVoiceRecognition();
}

function setInitialBodyHeight() {
  setBodyHeight();
}

function setBodyHeight() {
  document.body.style.minHeight = `${window.innerHeight}px`;
}

async function typeEffect(text, effectType, elements, state) {
  for (let i = 0; i <= text.length; i++) {
    if (state.activeEffect !== effectType) break;
    elements.typedOutput.textContent = text.substring(0, i);
    await delay(text[i - 1] === '.' ? 200 : 50);
  }
}

async function introEffect(elements, state) {
  state.activeEffect = 'intro';
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
    await typeEffect(sentence, 'intro', elements, state);
    await delay(1500);
  }
  if (state.activeEffect === 'intro') introEffect(elements, state);
}

async function displayCompanyInfo({ company_name: companyName, phone_number: phoneNumber, url }, elements, state) {
  state.activeEffect = 'company';
  const capitalizedCompanyName = capitalizeCompany(companyName);
  const sentence = `You asked to call: ${capitalizedCompanyName}`;
  elements.typedOutput.textContent = '';
  await typeEffect(sentence, 'company', elements, state);
  showConfirmationDialog(capitalizedCompanyName, phoneNumber, url, elements, state);
}

async function fetchCompanyData(company, elements, state) {
  elements.feedbackText.textContent = "";
  elements.voiceButton.classList.remove('voiceButton-listening');

  if (state.isConfirmationDialogOpen || state.isFetching) return;

  state.isFetching = true;
  elements.feedbackText.textContent = "";
  const cacheKey = `companyData-${company}`;
  const cachedData = state.cache.get(company);

  if (cachedData) {
    await displayCompanyInfo(cachedData, elements, state);
    state.isFetching = false;
    return;
  }

  try {
    const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.cache.set(company, data);
    await displayCompanyInfo(data, elements, state);
  } catch (error) {
    const errorMessage = error.message || 'An error occurred while fetching company data.';
    displayNotification(`${errorMessage} Please try again.`);
    introEffect(elements, state);
  } finally {
    state.isFetching = false;
  }
}

function showConfirmationDialog(companyName, phoneNumber, url, elements, state) {
  if (state.isConfirmationDialogOpen) return;
  state.isConfirmationDialogOpen = true;

  if (phoneNumber && phoneNumber !== "NA") {
    const messageContent = `${companyName}: ${phoneNumber}. Would you like to dial this number?`;
    if (confirm(messageContent)) {
      window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
    } else {
      introEffect(elements, state);
    }
  } else {
    displayNotification(`${companyName} does not have a phone number available.`);
    introEffect(elements, state);
  }

  state.isConfirmationDialogOpen = false;
}

function handleCompanySearchInput(event) {
  const value = event.target.value;
  event.target.value = capitalizeCompany(value);
}
