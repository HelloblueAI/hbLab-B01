// utils.js
import { config } from './config.js';


export const capitalizeCompany = (company) => {
  const uppercasedCompany = company.toUpperCase();
  if (config.UPPERCASE_COMPANIES.has(uppercasedCompany)) {
    return uppercasedCompany;
  } else {
    // Capitalize the first letter of each word for the company name
    return company.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
};


export const displayNotification = (message) => {
  // Implement the logic to display notifications to the user
  alert(message);
};

export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};