import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay, debounce } from './utils.js';
import VoiceRecognition from './voiceRecognition.js';

document.addEventListener('DOMContentLoaded', () => {
  const elements = getDOMElements();
  const state = getInitialState();
  setupEventListeners(elements, state);
  setBodyHeight();
  introEffect(elements, state);
  window.addEventListener('resize', debounce(setBodyHeight, 200));
  window.addEventListener('orientationchange', setBodyHeight);
});

const getDOMElements = () => ({
  voiceButton: document.getElementById('voiceButton'),
  companySearch: document.getElementById('companySearch'),
  typedOutput: document.getElementById('typed-output'),
  feedbackText: document.getElementById('feedbackText'),
  companyNameSpan: document.getElementById('companyName'),
  loginForm: document.getElementById('loginForm'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
});

const getInitialState = () => ({
  activeEffect: 'intro',
  isConfirmationDialogOpen: false,
  isFetching: false,
  cache: new Map(),
});

const setupEventListeners = (elements, state) => {
  const debouncedFetchCompanyData = debounce(() => {
    const value = elements.companySearch.value.trim();
    if (value) fetchCompanyData(capitalizeCompany(value), elements, state);
  }, 300);

  elements.companySearch.addEventListener('input', (event) => {
    handleCompanySearchInput(event, elements, debouncedFetchCompanyData);
  });

  new VoiceRecognition(elements, (company) => fetchCompanyData(company, elements, state));
};

const handleCompanySearchInput = (event, elements, debouncedFetchCompanyData) => {
  const { value } = event.target;
  const capitalizedValue = capitalizeCompany(value);
  if (value !== capitalizedValue) {
    const { selectionStart, selectionEnd } = event.target;
    event.target.value = capitalizedValue;
    event.target.setSelectionRange(selectionStart, selectionEnd);
  }
  if (value.trim() && value.length > 1) debouncedFetchCompanyData();
};

const setBodyHeight = () => {
  document.body.style.minHeight = `${window.innerHeight}px`;
};

const typeEffect = async (text, effectType, elements, state) => {
  for (let i = 0; i <= text.length; i++) {
    if (state.activeEffect !== effectType) break;
    elements.typedOutput.textContent = text.substring(0, i);
    await delay(text[i - 1] === '.' ? 100 : 30); 
  }
};

const introEffect = async (elements, state) => {
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
    await delay(1000); 
  }
  if (state.activeEffect === 'intro') introEffect(elements, state);
};

const displayCompanyInfo = async ({ company_name: companyName, phone_number: phoneNumber, url }, elements, state) => {
  state.activeEffect = 'company';
  const capitalizedCompanyName = capitalizeCompany(companyName);
  const sentence = `You asked to call: ${capitalizedCompanyName}`;
  elements.typedOutput.textContent = '';
  await typeEffect(sentence, 'company', elements, state);
  showConfirmationDialog(capitalizedCompanyName, phoneNumber, url, elements, state);
};

const fetchCompanyData = async (company, elements, state) => {
  if (state.isConfirmationDialogOpen || state.isFetching) return;

  state.isFetching = true;
  elements.feedbackText.textContent = "";
  elements.voiceButton.classList.remove('voiceButton-listening');
  const cacheKey = `companyData-${company}`;

  const cachedData = state.cache.get(cacheKey);
  if (cachedData) {
    await displayCompanyInfo(cachedData, elements, state);
    state.isFetching = false;
    return;
  }

  try {
    const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
    if (!response.ok) {
      if (response.status === 404) return;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.cache.set(cacheKey, data);
    await displayCompanyInfo(data, elements, state);
  } catch (error) {
    console.error('Fetch error:', error.message);
    elements.feedbackText.textContent = 'Failed to fetch company data. Please try again.';
  } finally {
    state.isFetching = false;
  }
};


const showConfirmationDialog = (companyName, phoneNumber, url, elements, state) => {
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
};
