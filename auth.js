import GoTrue from 'gotrue-js';
import { displayNotification } from './utils.js';

const auth = new GoTrue({
  APIUrl: 'https://helloblue.ai/.netlify/identity',
  setCookie: true,
});

export const login = async (email, password) => {
  try {
    const response = await auth.login(email, password);
    console.log("Success! Response: ", response);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error("Failed to login: ", error);
    displayNotification("Login failed. Please check your credentials and try again.");
    throw error;
  }
};