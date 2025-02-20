import { config } from './config.js';


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
/**
 * Advanced string formatting and validation utilities
 */
class StringFormatter {
  static #commonAbbreviations = new Set(['LLC', 'INC', 'CO', 'CORP', 'LTD', 'PLC', 'AG', 'SA', 'NV']);
  static #specialCaseWords = new Map([
    ['and', '&'],
    ['technology', 'Technologies'],
    ['software', 'Software'],
    ['bank', 'Bank'],
    ['insurance', 'Insurance']
  ]);

  /**
   * Intelligently formats company names considering common patterns and special cases
   * @param {string} company - The company name to format
   * @returns {string} Properly formatted company name
   */
  static formatCompanyName(company) {
    if (!company) return '';

    // Split into parts while preserving special characters
    const parts = company.split(/(\s+|(?=[&.])|(?<=[&.]))/).filter(Boolean);

    return parts.map((part, index) => {
      const upperPart = part.toUpperCase();

      // Handle known abbreviations
      if (this.#commonAbbreviations.has(upperPart)) {
        return upperPart;
      }

      // Handle special case words
      const lowerPart = part.toLowerCase();
      if (this.#specialCaseWords.has(lowerPart)) {
        return this.#specialCaseWords.get(lowerPart);
      }

      // Handle standard capitalization
      if (part.length <= 2 && index !== 0) {
        return lowerPart;
      }

      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
  }
}

/**
 * Enhanced company name capitalization with intelligent formatting
 * @param {string} company - The company name to capitalize
 * @returns {string} Properly formatted company name
 */
export const capitalizeCompany = (company) => {
  if (!company) return '';

  const uppercasedCompany = company.toUpperCase();
  if (config.UPPERCASE_COMPANIES.has(uppercasedCompany)) {
    return uppercasedCompany;
  }

  return StringFormatter.formatCompanyName(company);
};

/**
 * Notification system with advanced features
 */
class NotificationManager {
  static #instance = null;
  static #DEFAULT_DURATION = 3000;
  static #MAX_NOTIFICATIONS = 3;

  #notifications = [];
  #container = null;

  constructor() {
    if (NotificationManager.#instance) {
      return;
    }
    this.#createContainer();
    NotificationManager.#instance = this;
  }

  #createContainer() {
    this.#container = document.createElement('div');
    this.#container.className = 'notification-container';
    document.body.appendChild(this.#container);
  }

  /**
   * Displays a notification with enhanced features
   * @param {string} message - The message to display
   * @param {Object} options - Notification options
   */
  show(message, options = {}) {
    const {
      type = 'info',
      duration = NotificationManager.#DEFAULT_DURATION,
      action = null,
      icon = null
    } = options;

    // Manage notification queue
    if (this.#notifications.length >= NotificationManager.#MAX_NOTIFICATIONS) {
      const oldestNotification = this.#notifications.shift();
      oldestNotification.element.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Add icon if provided
    if (icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `notification-icon ${icon}`;
      notification.appendChild(iconElement);
    }

    // Add message
    const messageElement = document.createElement('span');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    notification.appendChild(messageElement);

    // Add action button if provided
    if (action) {
      const actionButton = document.createElement('button');
      actionButton.className = 'notification-action';
      actionButton.textContent = action.text;
      actionButton.onclick = () => {
        action.callback();
        this.#remove(notification);
      };
      notification.appendChild(actionButton);
    }

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => this.#remove(notification);
    notification.appendChild(closeButton);

    this.#container.appendChild(notification);
    this.#notifications.push({ element: notification, timer: null });

    // Set up automatic removal
    const timer = setTimeout(() => this.#remove(notification), duration);
    this.#notifications[this.#notifications.length - 1].timer = timer;

    // Add animation
    requestAnimationFrame(() => {
      notification.classList.add('notification-show');
    });
  }

  #remove(notification) {
    const index = this.#notifications.findIndex(n => n.element === notification);
    if (index !== -1) {
      clearTimeout(this.#notifications[index].timer);
      notification.classList.remove('notification-show');
      setTimeout(() => {
        notification.remove();
        this.#notifications.splice(index, 1);
      }, 300);
    }
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

/**
 * Enhanced notification display with support for actions and icons
 * @param {string} message - The message to display
 * @param {string} [type='info'] - Notification type
 * @param {Object} [options] - Additional options
 */
export const displayNotification = (message, type = 'info', options = {}) => {
  notificationManager.show(message, { type, ...options });
};

/**
 * Enhanced URL validation with additional checks
 * @param {string} url - The URL to validate
 * @param {Object} [options] - Validation options
 * @returns {Object} Validation result with details
 */
export const validateURL = (url, options = {}) => {
  const {
    requireHTTPS = true,
    allowedProtocols = ['https:', 'http:'],
    allowedDomains = null,
    requireWWW = false
  } = options;

  try {
    const parsedURL = new URL(url);

    const validationResult = {
      isValid: true,
      protocol: parsedURL.protocol,
      hostname: parsedURL.hostname,
      issues: []
    };

    if (requireHTTPS && parsedURL.protocol !== 'https:') {
      validationResult.issues.push('URL must use HTTPS');
    }

    if (!allowedProtocols.includes(parsedURL.protocol)) {
      validationResult.issues.push(`Protocol ${parsedURL.protocol} not allowed`);
    }

    if (allowedDomains && !allowedDomains.some(domain => parsedURL.hostname.endsWith(domain))) {
      validationResult.issues.push('Domain not allowed');
    }

    if (requireWWW && !parsedURL.hostname.startsWith('www.')) {
      validationResult.issues.push('URL must start with www');
    }

    validationResult.isValid = validationResult.issues.length === 0;
    return validationResult;

  } catch {
    return {
      isValid: false,
      issues: ['Invalid URL format']
    };
  }
};

/**
 * Simple URL validation (backwards compatibility)
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
export const isValidURL = (url) => validateURL(url).isValid;

/**
 * Enhanced delay function with cancellation support
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise with cancel method
 */
export const delay = (ms) => {
  let timeoutId;
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });

  promise.cancel = () => {
    clearTimeout(timeoutId);
  };

  return promise;
};

/**
 * Enhanced debounce with additional features
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} [options] - Additional options
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options;

  let timeout;
  let lastArgs;
  let lastThis;
  let lastCallTime = 0;
  let lastInvokeTime = 0;

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = Date.now();

    return func.apply(thisArg, args);
  }

  function shouldInvoke() {
    const timeSinceLastCall = Date.now() - lastCallTime;
    const timeSinceLastInvoke = Date.now() - lastInvokeTime;

    return (
      !lastCallTime ||
      timeSinceLastCall >= wait ||
      (maxWait && timeSinceLastInvoke >= maxWait)
    );
  }

  function startTimer(pendingFunc) {
    clearTimeout(timeout);
    timeout = setTimeout(pendingFunc, wait);
  }

  function cancel() {
    clearTimeout(timeout);
    lastArgs = lastThis = timeout = undefined;
    lastCallTime = lastInvokeTime = 0;
  }

  function flush() {
    return timeout ? invokeFunc() : undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (shouldInvoke()) {
      if (!timeout && leading) {
        lastInvokeTime = time;
        return invokeFunc();
      }
      if (maxWait) {
        startTimer(invokeFunc);
      }
    }

    if (!timeout && trailing) {
      startTimer(invokeFunc);
    }
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
};

/**
 * Throttle function implementation
 * @param {Function} func - Function to throttle
 * @param {number} wait - Throttle interval
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait) => {
  let timeout = null;
  let lastArgs = null;
  let lastThis = null;

  return function throttled(...args) {
    if (!timeout) {
      func.apply(this, args);
      timeout = setTimeout(() => {
        timeout = null;
        if (lastArgs) {
          throttled.apply(lastThis, lastArgs);
          lastArgs = lastThis = null;
        }
      }, wait);
    } else {
      lastArgs = args;
      lastThis = this;
    }
  };
};

/**
 * Format phone numbers consistently
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const regex = /^(\d{1,3})?(\d{3})(\d{3})(\d{4})$/;
  const result = regex.exec(cleaned);

  if (!result) return phone;

  const [, countryCode, areaCode, prefix, line] = result;
  if (countryCode) {
    return `+${countryCode} (${areaCode}) ${prefix}-${line}`;
  }
  return `(${areaCode}) ${prefix}-${line}`;
};

/**
 * Validate email addresses
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.exec(email) !== null;
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';

  // Create a temporary element to use the browser's built-in HTML escaping
  const tempDiv = document.createElement('div');
  tempDiv.textContent = input;
  const cleaned = tempDiv.innerHTML;

  return cleaned;
};

/**
 * Generate a random ID
 * @param {number} [length=8] - Length of ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  const clone = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }

  return clone;
};
