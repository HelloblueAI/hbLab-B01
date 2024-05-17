import { config } from './config.js';

/**
 * Capitalizes the company name appropriately.
 * @param {string} company - The company name to capitalize.
 * @returns {string} - The capitalized company name.
 */
export const capitalizeCompany = (company) => {
  const uppercasedCompany = company.toUpperCase();
  if (config.UPPERCASE_COMPANIES.has(uppercasedCompany)) {
    return uppercasedCompany;
  }
  // Capitalize the first letter of each word for the company name
  return company.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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

  document.body.appendChild(notificationContainer);

  setTimeout(() => {
    notificationContainer.remove();
  }, 3000); // Auto-remove notification after 3 seconds
};

/**
 * Validates a URL.
 * @param {string} url - The URL to validate.
 * @returns {boolean} - True if the URL is valid, otherwise false.
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
 * @returns {Promise<void>} - A promise that resolves after the delay.
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
