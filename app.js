//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { config } from './config.js';
import { capitalizeCompany, debounce, delay, displayNotification, isValidURL } from './utils.js';
import VoiceRecognition from './voicerecognition.js';

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const elements = getDOMElements();
  const state = new StateManager();

  setupEventListeners(elements, state);
  adjustBodyHeight();
  triggerIntroEffect(elements, state);

  const handleResize = debounce(adjustBodyHeight, 200);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
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

export class StateManager {
  constructor() {
    this.activeEffect = 'intro';
    this.isConfirmationDialogOpen = false;
    this.isFetching = false;
    this.cache = new Map();
    this.recentCompanies = [];
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
  }

  updateRecentCompanies(companyName) {
    this.recentCompanies.unshift(companyName);
    if (this.recentCompanies.length > 5) {
      this.recentCompanies.pop();
    }
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheDuration;
  }

  clearExpiredCache() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (value.timestamp < now) {
        this.cache.delete(key);
      }
    });
  }
}

function setupEventListeners(elements, state) {
  elements.voiceButton.setAttribute('aria-label', 'Activate voice recognition');
  elements.voiceButton.setAttribute('role', 'button');

  const debouncedFetchCompanyData = debounce(() => {
    const value = elements.companySearch.value.trim();
    if (value) {
      fetchCompanyData(capitalizeCompany(value), elements, state);
    }
  }, 300);

  elements.companySearch.addEventListener('input', (event) => {
    handleCompanySearchInput(event, elements, debouncedFetchCompanyData, state);
  });

  elements.companySearch.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = elements.companySearch.value.trim();
      if (value) {
        fetchCompanyData(capitalizeCompany(value), elements, state);
      }
    }
  });

  const voiceRecognition = new VoiceRecognition(
    elements,
    (spokenCompany) => {
      if (spokenCompany) {
        fetchCompanyData(capitalizeCompany(spokenCompany), elements, state);
      }
    },
    {
      interimResults: true,
      continuous: true,
      autoRestart: true,
    }
  );

  if (voiceRecognition && typeof voiceRecognition.start === 'function') {
    voiceRecognition.start();
    console.log('VoiceRecognition started successfully.');
  } else {
    console.error('VoiceRecognition failed to start. Ensure the class is implemented correctly.');
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
    if (state.activeEffect !== effectType) {
      break;
    }
    elements.typedOutput.textContent = text.substring(0, i);
    await delay(text[i - 1] === '.' ? 100 : 30);
  }
}

const introSentences = [
  "Hello, I'm B01",
  'I broke out of the internet to help you contact any company',
  'Phone and Instant Live Chat',
  "Simply say or type the company's name like Verizon or Amazon or Chase",
  "I'll connect you in seconds!",
  "Whether it's Apple, Discover, Delta, or Netflix",
  'Ready to connect?',
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
  if (state.activeEffect === 'intro') {
    triggerIntroEffect(elements, state);
  }
}

async function displayCompanyInfo(
  { company_name: companyName, phone_number: phoneNumber, url },
  elements,
  state
) {
  state.activeEffect = 'company';
  const capitalizedCompanyName = capitalizeCompany(companyName);
  const message = `You asked to call: ${capitalizedCompanyName}`;

  elements.typedOutput.textContent = '';
  await typeTextEffect(message, 'company', elements, state);

  state.updateRecentCompanies(capitalizedCompanyName);
  showCompanyConfirmationDialog(capitalizedCompanyName, phoneNumber, url, elements, state);
}

async function fetchCompanyData(company, elements, state, retryCount = 0) {
  if (state.isConfirmationDialogOpen || state.isFetching) {
    return;
  }

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
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
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      elements.feedbackText.textContent = 'Request timed out. Please try again.';
    } else if (retryCount < 3) {
      const retryDelay = 1000 * Math.pow(2, retryCount);
      elements.feedbackText.textContent = `Retrying in ${retryDelay / 1000} seconds...`;
      setTimeout(() => fetchCompanyData(company, elements, state, retryCount + 1), retryDelay);
    } else {
      elements.feedbackText.textContent = 'Failed to fetch company data after multiple attempts.';
      displayNotification('Unable to retrieve company data. Please check your connection and try again later.');
    }
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

function showCompanyConfirmationDialog(companyName, phoneNumber, url, elements, state) {
  if (state.isConfirmationDialogOpen) {
    return;
  }

  state.isConfirmationDialogOpen = true;
  const messageContent =
    phoneNumber && phoneNumber !== 'NA'
      ? `${companyName}: ${phoneNumber}. Would you like to dial this number?`
      : `${companyName} does not have a phone number available.`;

  if (phoneNumber && phoneNumber !== 'NA') {
    if (confirm(messageContent)) {
      window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/\D/g, '')}`;

      showPostCallNotification(companyName, elements, state); // Display recent call notification
    }
  } else {
    displayNotification(messageContent);
    triggerIntroEffect(elements, state);
  }

  state.isConfirmationDialogOpen = false;
}

async function showPostCallNotification(companyName, elements, state) {
  const message = `You recently asked to call: ${capitalizeCompany(companyName)}`;
  state.activeEffect = 'postCall';
  elements.typedOutput.textContent = '';
  await typeTextEffect(message, 'postCall', elements, state);

  await delay(15000);
}

function displaySuggestions(input, elements, state) {
  const suggestions = state.recentCompanies.filter((company) =>
    company.toLowerCase().includes(input.toLowerCase())
  );
  elements.suggestionBox.innerHTML = suggestions
    .map((suggestion) => `<div class="suggestion">${suggestion}</div>`)
    .join('');

  elements.suggestionBox.querySelectorAll('.suggestion').forEach((item) => {
    item.addEventListener('click', () => {
      elements.companySearch.value = item.textContent;
      fetchCompanyData(capitalizeCompany(item.textContent), elements, state);
    });
  });
}
