document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    const API_ENDPOINT = 'http://localhost:3002/api/company?name=';
    const cache = new Map();

    const elements = {
        voiceButton: document.getElementById('voiceButton'),
        companySearch: document.getElementById('companySearch'),
        typedOutput: document.getElementById('typed-output'),
        feedbackText: document.getElementById('feedbackText'),
        companyNameSpan: document.getElementById('companyName'),
        callMessageContainer: document.querySelector('.call-message-container'),
    };

    if (Object.values(elements).some(el => !el)) {
        console.error("Some DOM elements are missing.");
        return;
    }

    console.log("All required elements are present");

// Set of company names that should always be uppercase
const UPPERCASE_COMPANIES = new Set([
    'AMEX',
    'DHL',
    'IBM',
    'UPS',
    'TD',
    'CHASE',
    'USPS',
    'AT&T',
    'NASA',
    'CNN',
    'HP',
    'JFK',
    'H&M',
    'IKEA',
    'BMW',
    'KFC',
    'EA',
    '3M',
    'GE',
    'LG'
]);

// Function to capitalize the first letter of a string
// and ensure that certain company names are displayed in uppercase
const capitalizeFirstLetter = string => {
    if (typeof string !== 'string' || string.length === 0) {
        console.error('capitalizeFirstLetter was called with an argument that is not a string:', string);
        return '';
    }
    
    // If the company name is in the UPPERCASE_COMPANIES set, return it in uppercase
    if (UPPERCASE_COMPANIES.has(string.toUpperCase())) {
        return string.toUpperCase();
    } else {
        // Otherwise, capitalize only the first letter and set the rest to lowercase
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
};

    
    
    const displayNotification = message => alert(message);

    const isValidURL = url => {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    };

    const typingEffect = () => {
        const sentences = [
            "Hello. I'm B01, an AI Agent.",
            "I broke out of the internet to help you contact any company...",
            "Phone or Live Chat",
            "Connect to over 12K customer services",
            "Less than 3 seconds :)",
            "Got a company in mind? Just say the word or type it in",
            "Finding customer service has never been this easy",
            "Ready to connect?",
            "I'm here to assist...!",
        ];

        let index = 0;
        let charIndex = 0;

        const type = () => {
            const currentSentence = sentences[index];
            elements.typedOutput.textContent = currentSentence.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex > currentSentence.length) {
                charIndex = 0;
                index = (index + 1) % sentences.length;
                setTimeout(type, 1500);
            } else {
                let delay = currentSentence.charAt(charIndex - 1) === '.' ? 300 : 60;
                setTimeout(type, delay);
            }
        };

        setTimeout(type, 500); // Start typing effect after a short delay
    };

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;

    recognition.onstart = () => {
        elements.feedbackText.textContent = "Listening...";
        elements.voiceButton.classList.add('voiceButton-listening');
    };

    recognition.onresult = (event) => {
        const company = capitalizeFirstLetter(event.results[event.results.length - 1][0].transcript.trim());
        console.log(`Voice recognition result: ${company}`);
        fetchCompanyData(company);
    };

    recognition.onerror = (event) => {
        let errorMessage = "An error occurred with voice recognition: " + event.error;
        console.error(errorMessage);
        displayNotification(errorMessage);
    };

    recognition.onend = () => {
        console.log("Voice recognition ended");
        elements.feedbackText.textContent = "";
        elements.voiceButton.classList.remove('voiceButton-listening');
    };

    elements.voiceButton.addEventListener('click', () => {
        if (recognition.listening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    elements.companySearch.addEventListener('input', event => {
        const value = capitalizeFirstLetter(event.target.value);
        elements.companySearch.value = value;
    });

    elements.companySearch.addEventListener('keypress', event => {
        if (event.key === 'Enter' && event.target.value.trim() !== '') {
            fetchCompanyData(event.target.value.trim());
        }
    });

    const fetchCompanyData = async company => {
        console.log(`Fetching data for: ${company}`);
        recognition.stop();
        elements.feedbackText.textContent = "";
        elements.voiceButton.classList.remove('voiceButton-listening');

        if (cache.has(company)) {
            console.log(`Using cached data for: ${company}`);
            processCompanyData(cache.get(company));
            return;
        }

        const encodedCompany = encodeURIComponent(company);
        const urlToFetch = `${API_ENDPOINT}${encodedCompany}`;
        console.log(`Making API call to: ${urlToFetch}`);

        try {
            const response = await fetch(urlToFetch);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log(`Data received for ${company}:`, data);
            cache.set(company, data);
            processCompanyData(data);
        } catch (error) {
            console.error(`Failed to fetch company data for ${company}:`, error);
            displayNotification(`Failed to fetch data for ${company}. Please try again.`);
        }
    };

    const processCompanyData = data => {
        console.log("Processing company data:", data);
        if (!data || !data.companyname) {
            displayNotification('Company not found. Please try a different search.');
            return;
        }
    
        const companyName = capitalizeFirstLetter(data.companyname);
        const phoneNumber = data.phonenumber;
    
        if (phoneNumber && phoneNumber !== "NA") {
            const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            const messageContent = `${companyName}: ${cleanPhoneNumber}. Would you like to dial this number?`;
            if (confirm(messageContent)) {
                window.location.href = `tel:${cleanPhoneNumber}`;
            }
        } else {
            displayNotification(`${companyName} does not have a phone number available.`);
        }
    };
    
    // Initialize the typing effect and other functions you might have here
    typingEffect();
    setupCompanySearchListener();
})();
