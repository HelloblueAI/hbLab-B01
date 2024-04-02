// app.js
import { config } from './config.js';
import { capitalizeCompany, displayNotification, isValidURL, delay } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        voiceButton: document.getElementById('voiceButton'),
        companySearch: document.getElementById('companySearch'),
        typedOutput: document.getElementById('typed-output'),
        feedbackText: document.getElementById('feedbackText'),
        companyNameSpan: document.getElementById('companyName'),
    };

    const cache = new Map();
    let isSearching = false;

    const typingEffect = async () => {
        if (isSearching) return;
        const sentences = [
            "Hello, I'm B01",
            "I broke out of the internet to help you contact any company",
            "Phone and Instant Live Chat",
            "All in under 3 seconds",
            "Got a company in mind? Just say the word or type it in",
            "Connecting to customer services has never been this fast",
            "Ready to connect?",
            "I'm here to assist...!",
        ];

        for (const sentence of sentences) {
            await typesentence(sentence);
            await delay(1500);
        }
        if (!isSearching) typingEffect();
    };

    const typesentence = async (sentence) => {
        for (let i = 0; i <= sentence.length; i++) {
            elements.typedOutput.textContent = sentence.substring(0, i);
            await delay(sentence[i - 1] === '.' ? 300 : 120);
        }
    };

    const fetchCompanyData = async (company) => {
        recognition.stop();
        elements.feedbackText.textContent = "";
        elements.voiceButton.classList.remove('voiceButton-listening');

        if (cache.has(company)) {
            processCompanyData(cache.get(company));
            return;
        }

        try {
            const response = await fetch(`${config.API_ENDPOINT}${encodeURIComponent(company)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            cache.set(company, data);
            processCompanyData(data);
        } catch (error) {
            console.error(`Failed to fetch company data:`, error);
            displayNotification(`Failed to fetch data for ${company}. Please try again.`);
        }
    };

    const displayCompanyTypingEffect = async (companyName) => {
        const sentence = `You asked to call: ${companyName}`;
        elements.typedOutput.textContent = '';
        elements.companyNameSpan.classList.remove('hidden');

        await typesentence(sentence);
        await delay(5000);
    };

    const processCompanyData = (data) => {
        if (!data || !data.name) {
            displayNotification('Company not found. Please try a different search.');
            return;
        }

        const companyName = capitalizeCompany(data.name);
        displayCompanyTypingEffect(companyName);
        handleCompanyActions(data);
    };

    const handleCompanyActions = (data) => {
        const correctedCompanyName = capitalizeCompany(data.name);
        const phoneNumber = data.number;

        if (phoneNumber && phoneNumber !== "NA") {
            const messageContent = `${correctedCompanyName}: ${phoneNumber}. Would you like to dial this number?`;
            if (confirm(messageContent)) {
                window.location.href = isValidURL(data.url) ? data.url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
            }
        } else {
            displayNotification(`${correctedCompanyName} does not have a phone number available.`);
        }
    };

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;

    recognition.onstart = () => {
        elements.feedbackText.textContent = "Listening...";
        elements.voiceButton.classList.add('voiceButton-listening');
    };

    recognition.onresult = (event) => {
        const company = capitalizeCompany(event.results[event.results.length - 1][0].transcript.trim());
        elements.companySearch.value = '';
        fetchCompanyData(company);
    };

    recognition.onerror = (event) => {
        const errorMessage = {
            "no-speech": "No speech was detected. Please try again.",
            "aborted": "Voice recognition was aborted. Please try again.",
            "audio-capture": "Microphone is not accessible. Please ensure you've granted the necessary permissions.",
            "network": "Network issues prevented voice recognition. Please check your connection.",
            "not-allowed": "Permission to access microphone was denied. Please allow access to use this feature.",
            "service-not-allowed": "The speech recognition feature is not supported by Instagram browser. For company searches, use your keyboard. Please visit helloblue.ai for the speech recognition feature.",
        }[event.error] || "An unknown error occurred with voice recognition.";

        displayNotification(errorMessage);
    };

    recognition.onend = () => {
        elements.feedbackText.textContent = "";
        elements.voiceButton.classList.remove('voiceButton-listening');
    };

    const setupVoiceRecognition = () => {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            displayNotification("Your browser doesn't support voice recognition.");
            return;
        }

        elements.voiceButton.addEventListener('click', async () => {
            if (elements.voiceButton.classList.contains('voiceButton-listening')) {
                recognition.stop();
                return;
            }

            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                recognition.start();
            } catch (error) {
                console.error('Error accessing microphone:', error);
                displayNotification("Failed to access the microphone. Please check your browser settings and ensure you've granted the necessary permissions.");
            }
        });
    };

    elements.companySearch.addEventListener('input', (event) => {
        event.target.value = capitalizeCompany(event.target.value.trim());
    });

    elements.companySearch.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && event.target.value.trim() !== '') {
            fetchCompanyData(capitalizeCompany(event.target.value.trim()));
        }
    });

    Promise.all([typingEffect(), setupVoiceRecognition()]).catch((error) => {
        console.error('Error initializing the application:', error);
        displayNotification('An error occurred while initializing the application. Please try again later.');
    });
});