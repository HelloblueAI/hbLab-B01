// utils.js
import { config } from './config.js';

export const capitalizeCompany = (company) => {
    return config.UPPERCASE_COMPANIES.has(company.toUpperCase()) ?
        company.toUpperCase() :
        company.charAt(0).toUpperCase() + company.slice(1).toLowerCase();
};

export const displayNotification = (message) => {
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