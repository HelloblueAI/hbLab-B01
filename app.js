import { config } from './config.js';
import { capitalizeCompany, debounce, delay, displayNotification, isValidURL } from './utils.js';
import VoiceRecognition from './voiceRecognition.js';

document.addEventListener('DOMContentLoaded', initApp);

// Initialize the application
function initApp() {
  resetScrollPosition(); // Ensures the page starts at the top
  const elements = getDOMElements();
  const state = new StateManager();

  setupEventListeners(elements, state);
  adjustBodyHeight();
  triggerIntroEffect(elements, state);

  setupResizeAndOrientationListeners();
}

// Scroll to the top on page load
function resetScrollPosition() {
  window.scrollTo(0, 0);
}

// Adjust body height dynamically for viewport
function adjustBodyHeight() {
  document.body.style.minHeight = `${window.innerHeight}px`;
}

// Handle resize and orientation changes
function setupResizeAndOrientationListeners() {
  const handleResize = debounce(adjustBodyHeight, 200);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
}

// Retrieve and return DOM elements
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
    suggestionBox: document.getElementById('suggestionBox'),
    stopRecognitionButton: document.getElementById('stopRecognitionButton'),
  };
}

// State manager for application state
class StateManager {
  constructor() {
    this.activeEffect = 'intro';
    this.isConfirmationDialogOpen = false;
    this.isFetching = false;
    this.cache = new Map();
    this.recentCompanies = [];
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
  }

  updateRecentCompanies(companyName) {
    this.recentCompanies = [companyName, ...this.recentCompanies.slice(0, 4)];
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheDuration;
  }

  clearExpiredCache() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (value.timestamp < now) this.cache.delete(key);
    });
  }
}

// Setup event listeners for DOM elements
function setupEventListeners(elements, state) {
  const debouncedFetchCompanyData = debounce(() => {
    const value = elements.companySearch.value.trim();
    if (value) fetchCompanyData(capitalizeCompany(value), elements, state);
  }, 300);

  elements.companySearch.addEventListener('input', (event) =>
    handleCompanySearchInput(event, elements, debouncedFetchCompanyData, state)
  );

  elements.companySearch.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = elements.companySearch.value.trim();
      if (value) fetchCompanyData(capitalizeCompany(value), elements, state);
    }
  });

  initializeVoiceRecognition(elements, state);
}

// Voice recognition setup
function initializeVoiceRecognition(elements, state) {
  const voiceRecognition = new VoiceRecognition(
    elements,
    (spokenCompany) => {
      if (spokenCompany) fetchCompanyData(capitalizeCompany(spokenCompany), elements, state);
    },
    { interimResults: true, continuous: true, autoRestart: true }
  );

  if (voiceRecognition && typeof voiceRecognition.start === 'function') {
    voiceRecognition.start();
    console.log('VoiceRecognition started successfully.');
  } else {
    console.error('VoiceRecognition failed to start.');
  }

  if (typeof voiceRecognition.onError === 'function') {
    voiceRecognition.onError((error) => {
      console.error('VoiceRecognition error:', error);
      displayNotification('Voice recognition encountered an issue. Please try again.');
    });
  }

  if (elements.stopRecognitionButton) {
    elements.stopRecognitionButton.addEventListener('click', () => {
      if (voiceRecognition && typeof voiceRecognition.stop === 'function') {
        voiceRecognition.stop();
        console.log('VoiceRecognition stopped.');
      }
    });
  }
}

// Handle user input in the company search bar
function handleCompanySearchInput(event, elements, debouncedFetchCompanyData, state) {
  const { value } = event.target;
  const capitalizedValue = capitalizeCompany(value);

  if (value !== capitalizedValue) adjustCursorPosition(event, capitalizedValue);

  if (value.trim() && value.length > 1) {
    debouncedFetchCompanyData();
    displaySuggestions(value, elements, state);
  } else {
    elements.suggestionBox.innerHTML = '';
  }
}

// Adjust cursor position after value change
function adjustCursorPosition(event, capitalizedValue) {
  const { selectionStart, selectionEnd } = event.target;
  event.target.value = capitalizedValue;
  event.target.setSelectionRange(selectionStart, selectionEnd);
}

// Trigger introductory typing effect
async function triggerIntroEffect(elements, state) {
  const introSentences = [
    "Hello, I'm B01",
    'I broke out of the internet to help you contact any company',
    'Phone and Instant Live Chat',
    "Simply say or type the company's name like Verizon or Amazon or Chase",
    "I'll connect you in seconds!",
    'Ready to connect?',
    "I'm here to assist!",
  ];

  if (state.recentCompanies.length > 0) {
    introSentences.push(`You recently searched for ${state.recentCompanies.join(', ')}.`);
  }

  state.activeEffect = 'intro';
  for (const sentence of introSentences) {
    await typeTextEffect(sentence, 'intro', elements, state);
    await delay(1000);
  }

  if (state.activeEffect === 'intro') triggerIntroEffect(elements, state);
}

// Typing effect for text
async function typeTextEffect(text, effectType, elements, state) {
  for (let i = 0; i <= text.length; i++) {
    if (state.activeEffect !== effectType) break;
    elements.typedOutput.textContent = text.substring(0, i);
    await delay(text[i - 1] === '.' ? 100 : 30);
  }
}

// Fetch company data
async function fetchCompanyData(company, elements, state) {
  if (state.isConfirmationDialogOpen || state.isFetching) return;

  state.isFetching = true;
  elements.feedbackText.textContent = '';
  elements.voiceButton.classList.remove('voiceButton-listening');

  const cacheKey = `companyData-${company}`;
  const cachedData = state.cache.get(cacheKey);

  if (cachedData && !state.isCacheExpired(cachedData.timestamp)) {
    await displayCompanyInfo(cachedData.data, elements, state);
    state.isFetching = false;
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) {
      handleErrorStatus(response.status, elements);
      return;
    }

    const data = await response.json();
    state.cache.set(cacheKey, { data, timestamp: Date.now() });
    await displayCompanyInfo(data, elements, state);
  } catch (error) {
    handleFetchError(error, elements, state, company);
  } finally {
    state.isFetching = false;
  }
}

// Handle fetch errors
function handleFetchError(error, elements, state, company) {
  if (error.name === 'AbortError') {
    elements.feedbackText.textContent = 'Request timed out. Please try again.';
  } else {
    elements.feedbackText.textContent = 'Failed to fetch company data.';
    setTimeout(() => fetchCompanyData(company, elements, state), 3000);
  }
}

// Display company info
async function displayCompanyInfo({ company_name, phone_number, url }, elements, state) {
  const companyName = capitalizeCompany(company_name);
  const message = `You asked to call: ${companyName}`;

  state.updateRecentCompanies(companyName);
  elements.typedOutput.textContent = '';
  await typeTextEffect(message, 'company', elements, state);

  showCompanyConfirmationDialog(companyName, phone_number, url, elements, state);
}

// Show confirmation dialog
function showCompanyConfirmationDialog(companyName, phoneNumber, url, elements, state) {
  if (state.isConfirmationDialogOpen) return;

  state.isConfirmationDialogOpen = true;

  const message = phoneNumber
    ? `${companyName}: ${phoneNumber}. Would you like to dial this number?`
    : `${companyName} does not have a phone number available.`;

  if (phoneNumber && confirm(message)) {
    window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/\D/g, '')}`;
  } else {
    displayNotification(message);
    triggerIntroEffect(elements, state);
  }

  state.isConfirmationDialogOpen = false;
}

// Display suggestions
function displaySuggestions(input, elements, state) {
  const suggestions = state.recentCompanies.filter((company) =>
    company.toLowerCase().includes(input.toLowerCase())
  );

  elements.suggestionBox.innerHTML = suggestions
    .map((suggestion) => `<div class="suggestion">${suggestion}</div>`)
    .join('');

  elements.suggestionBox.querySelectorAll('.suggestion').forEach((item) =>
    item.addEventListener('click', () => {
      elements.companySearch.value = item.textContent;
      fetchCompanyData(capitalizeCompany(item.textContent), elements, state);
    })
  );
}

// Handle error statuses
function handleErrorStatus(status, elements) {
  if (status === 404) {
    elements.feedbackText.textContent = 'Company not found.';
  } else {
    throw new Error(`Unexpected HTTP status: ${status}`);
  }
}
