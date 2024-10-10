import { config } from './config.js';

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
const capitalizeWords = (str) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Capitalizes the company name appropriately.
 * @param {string} company - The company name to capitalize.
 * @returns {string} The capitalized company name.
 */
export const capitalizeCompany = (company) => {
  const uppercasedCompany = company.toUpperCase();
  if (config.UPPERCASE_COMPANIES.has(uppercasedCompany)) {
    return uppercasedCompany;
  }
  return capitalizeWords(company);
};

/**
 * Displays a notification to the user.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of notification (e.g., 'info', 'error', 'success').
 */
export const displayNotification = (message, type = 'info') => {
  const notificationContainer = document.createElement('div');
  notificationContainer.className = `notification ${type}`;
  notificationContainer.textContent = message;

  // Append to the document body
  document.body.appendChild(notificationContainer);

  // Auto-remove notification after 3 seconds
  setTimeout(() => {
    notificationContainer.remove();
  }, 3000);
};

/**
 * Validates a URL.
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is valid, otherwise false.
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Delays execution for a specified amount of time.
 * @param {number} ms - The delay time in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * @param {function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {function} The debounced function.
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
