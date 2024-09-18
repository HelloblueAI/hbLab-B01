import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay, debounce } from './utils.js';
import VoiceRecognition from './voiceRecognition.js';

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const elements = getDOMElements();
  const state = initializeState();

  setupEventListeners(elements, state);
  adjustBodyHeight();
  triggerIntroEffect(elements, state);

  window.addEventListener('resize', debounce(adjustBodyHeight, 200));
  window.addEventListener('orientationchange', adjustBodyHeight);
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
    suggestionBox: document.getElementById('suggestionBox'),
  };
}

function initializeState() {
  return {
    activeEffect: 'intro',
    isConfirmationDialogOpen: false,
    isFetching: false,
    cache: new Map(),
    recentCompanies: [],
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours, can be parameterized
  };
}

function setupEventListeners(elements, state) {
  const debouncedFetchCompanyData = debounce(() => {
    const value = elements.companySearch.value.trim();
    if (value) fetchCompanyData(capitalizeCompany(value), elements, state);
  }, 300);

  elements.companySearch.addEventListener('input', (event) => {
    handleCompanySearchInput(event, elements, debouncedFetchCompanyData, state);
  });

  elements.companySearch.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = elements.companySearch.value.trim();
      if (value) fetchCompanyData(capitalizeCompany(value), elements, state);
    }
  });

  new VoiceRecognition(elements, (company) => fetchCompanyData(company, elements, state), {
    interimResults: true,
    continuous: true,
    autoRestart: true,
  });
}

function handleCompanySearchInput(event, elements, debouncedFetchCompanyData, state) {
  const { value } = event.target;
  const capitalizedValue = capitalizeCompany(value);

  if (value !== capitalizedValue) {
    adjustCursorPosition(event, capitalizedValue);
  }

  if (value.trim() && value.length > 1) {
    debouncedFetchCompanyData();
    displaySuggestions(value, elements, state);
  } else {
    elements.suggestionBox.innerHTML = '';
  }
}

function adjustCursorPosition(event, capitalizedValue) {
  const { selectionStart, selectionEnd } = event.target;
  event.target.value = capitalizedValue;
  event.target.setSelectionRange(selectionStart, selectionEnd);
}

function adjustBodyHeight() {
  document.body.style.minHeight = `${window.innerHeight}px`;
}

async function typeTextEffect(text, effectType, elements, state) {
  for (let i = 0; i <= text.length; i++) {
    if (state.activeEffect !== effectType) break;
    elements.typedOutput.textContent = text.substring(0, i);
    await delay(text[i - 1] === '.' ? 100 : 30);
  }
}

const introSentences = [
  "Hello, I'm B01",
  "I broke out of the internet to help you contact any company",
  "Phone and Instant Live Chat",
  "Simply say or type the company's name like Verizon or Amazon or Geico",
  "I'll connect you in seconds",
  "Whether it's Apple, Discover, Delta, or Netflix",
  "Ready to connect?",
  "I'm here to assist!",
];

async function triggerIntroEffect(elements, state) {
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

async function displayCompanyInfo({ company_name: companyName, phone_number: phoneNumber, url }, elements, state) {
  state.activeEffect = 'company';
  const capitalizedCompanyName = capitalizeCompany(companyName);
  const message = `You asked to call: ${capitalizedCompanyName}`;
  
  elements.typedOutput.textContent = '';
  await typeTextEffect(message, 'company', elements, state);

  updateRecentCompanies(state, capitalizedCompanyName);
  showCompanyConfirmationDialog(capitalizedCompanyName, phoneNumber, url, elements, state);
}

function updateRecentCompanies(state, companyName) {
  state.recentCompanies.unshift(companyName);
  if (state.recentCompanies.length > 5) state.recentCompanies.pop();
}

async function fetchCompanyData(company, elements, state) {
  if (state.isConfirmationDialogOpen || state.isFetching) return;

  state.isFetching = true;
  elements.feedbackText.textContent = '';
  elements.voiceButton.classList.remove('voiceButton-listening');
  
  const cacheKey = `companyData-${company}`;
  const cachedData = state.cache.get(cacheKey);
  
  if (cachedData && !isCacheExpired(cachedData.timestamp, state.cacheDuration)) {
    await displayCompanyInfo(cachedData.data, elements, state);
    state.isFetching = false;
    return;
  }

  try {
    const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
    if (response.ok) {
      const data = await response.json();
      state.cache.set(cacheKey, { data, timestamp: Date.now() });
      await displayCompanyInfo(data, elements, state);
    } else {
      handleErrorStatus(response.status, elements);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
    handleFetchError(elements, state, company);
  } finally {
    state.isFetching = false;
  }
}

function handleErrorStatus(status, elements) {
  if (status === 404) {
    elements.feedbackText.textContent = 'Company not found. Please try another one.';
  } else {
    throw new Error(`Unexpected HTTP status: ${status}`);
  }
}

function handleFetchError(elements, state, company) {
  elements.feedbackText.textContent = 'Failed to fetch company data. Retrying...';
  setTimeout(() => fetchCompanyData(company, elements, state), 3000);
}

function isCacheExpired(timestamp, cacheDuration) {
  return (Date.now() - timestamp) > cacheDuration;
}

function showCompanyConfirmationDialog(companyName, phoneNumber, url, elements, state) {
  if (state.isConfirmationDialogOpen) return;

  state.isConfirmationDialogOpen = true;
  if (phoneNumber && phoneNumber !== 'NA') {
    const messageContent = `${companyName}: ${phoneNumber}. Would you like to dial this number?`;
    if (confirm(messageContent)) {
      window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
    } else {
      triggerIntroEffect(elements, state);
    }
  } else {
    displayNotification(`${companyName} does not have a phone number available.`);
    triggerIntroEffect(elements, state);
  }

  state.isConfirmationDialogOpen = false;
}

function displaySuggestions(input, elements, state) {
  const suggestions = state.recentCompanies.filter(company => company.toLowerCase().includes(input.toLowerCase()));
  elements.suggestionBox.innerHTML = suggestions.map(suggestion => `<div class="suggestion">${suggestion}</div>`).join('');
  
  elements.suggestionBox.querySelectorAll('.suggestion').forEach(item => {
    item.addEventListener('click', () => {
      elements.companySearch.value = item.textContent;
      fetchCompanyData(capitalizeCompany(item.textContent), elements, state);
    });
  });
}
