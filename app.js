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
    let activeEffect = 'intro';

    const typeEffect = async (text, effectType) => {
        for (let i = 0; i <= text.length; i++) {
            if (activeEffect !== effectType) break;
            elements.typedOutput.textContent = text.substring(0, i);
            await delay(text[i - 1] === '.' ? 200 : 50);
        }
    };

    const introEffect = async () => {
        activeEffect = 'intro';
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
            await typeEffect(sentence, 'intro');
            await delay(1500);
        }
        if (activeEffect === 'intro') introEffect();
    };

    let fetchTimeout;

    elements.companySearch.addEventListener('input', (event) => {
        event.target.value = capitalizeCompany(event.target.value.trim());
        clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(async () => {
            const company = capitalizeCompany(event.target.value.trim());
            if (company !== '') {
                await fetchCompanyData(company);
            }
        }, 500);
    });

    elements.companySearch.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && event.target.value.trim() !== '') {
            clearTimeout(fetchTimeout);
            const company = capitalizeCompany(event.target.value.trim());
            await fetchCompanyData(company);
        }
    });

    const displayCompanyInfo = async (companyName, phoneNumber, url) => {
        activeEffect = 'company';
        const sentence = `You asked to call: ${companyName}`;
        elements.typedOutput.textContent = '';
        elements.companyNameSpan.style.display = 'inline';
        await typeEffect(sentence, 'company');
    };

    const showConfirmationDialog = (companyName, phoneNumber, url) => {
        if (phoneNumber && phoneNumber !== "NA") {
            const messageContent = `${companyName}: ${phoneNumber}. Would you like to dial this number?`;
            if (confirm(messageContent)) {
                window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
            }
        } else {
            displayNotification(`${companyName} does not have a phone number available.`);
        }
    };

    const fetchCompanyData = async (company) => {
        elements.feedbackText.textContent = "";
        const cacheKey = `companyData-${company}`;

        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            await displayCompanyInfo(data.name, data.number, data.url);
            showConfirmationDialog(data.name, data.number, data.url);
            return;
        }

        try {
            const response = await fetch(`${config.API_ENDPOINT}${encodeURIComponent(company)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            localStorage.setItem(cacheKey, JSON.stringify(data));

            await displayCompanyInfo(data.name, data.number, data.url);
            showConfirmationDialog(data.name, data.number, data.url);
        } catch (error) {
            console.error(`Failed to fetch company data:`, error);
            displayNotification(`Failed to fetch data for ${company}. Please try again.`);
        }
    };

    const handleVoiceInput = async (transcript) => {
        const company = capitalizeCompany(transcript.trim());
        elements.companySearch.value = company;
        await fetchCompanyData(company);
    };

    const setupVoiceRecognition = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;

        recognition.onstart = () => {
            elements.feedbackText.textContent = "Listening...";
            elements.voiceButton.classList.add('voiceButton-listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleVoiceInput(transcript);
        };

        recognition.onerror = (event) => {
            const errorMessage = {
                "no-speech": "No speech was detected. Please try again.",
                "aborted": "Voice recognition was aborted. Please try again.",
                "audio-capture": "Microphone is not accessible. Please ensure you've granted the necessary permissions.",
                "network": "Network issues prevented voice recognition. Please check your connection.",
                "not-allowed": "Permission to access microphone was denied. Please allow access to use this feature.",
                "service-not-allowed": "The speech recognition feature is not supported by your browser. For company searches, use your keyboard.",
            }[event.error] || "An unknown error occurred with voice recognition.";

            displayNotification(errorMessage);
        };

        recognition.onend = () => {
            elements.feedbackText.textContent = "";
            elements.voiceButton.classList.remove('voiceButton-listening');
        };

        elements.voiceButton.onclick = async () => {
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
        };
    };

    const animateMicrophoneButton = () => {
        elements.voiceButton.classList.add('animate-pulse');
    };

    const stopMicrophoneButtonAnimation = () => {
        elements.voiceButton.classList.remove('animate-pulse');
    };

    elements.companySearch.addEventListener('focus', introEffect);
    elements.companySearch.addEventListener('input', (event) => {
        event.target.value = capitalizeCompany(event.target.value.trim());
    });
    elements.companySearch.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && event.target.value.trim() !== '') {
            const company = capitalizeCompany(event.target.value.trim());
            await fetchCompanyData(company);
        }
    });

    setupVoiceRecognition();
    introEffect();
});