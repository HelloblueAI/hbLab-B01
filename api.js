import { config } from './config.js';
import { displayNotification } from './utils.js';

export const fetchCompanyData = async (company) => {
  try {
    const response = await fetch(`${config.API_ENDPOINT}?name=${encodeURIComponent(company)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching company data:', error);
    displayNotification('Failed to fetch company data. Please try again.');
    throw error;
  }
};