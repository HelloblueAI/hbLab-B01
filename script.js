document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    (() => {
        const API_ENDPOINT = 'https://hblab-399712.uw.r.appspot.com/api/company?name=';
        const cache = new Map();

        // Set of company names that should always be uppercase
        const UPPERCASE_COMPANIES = new Set([
            'AMEX', 'DHL', 'IBM', 'UPS', 'TD', 'CHASE', 'USPS', 'AT&T',
            'NASA', 'CNN', 'HP', 'JFK', 'H&M', 'IKEA', 'BMW', 'KFC', 'EA', '3M', 'GE', 'LG'
        ]);

        const elements = {
            voiceButton: document.getElementById('voiceButton'),
            companySearch: document.getElementById('companySearch'),
            typedOutput: document.getElementById('typed-output'),
            feedbackText: document.getElementById('feedbackText'),
            companyNameSpan: document.getElementById('companyName'),
        };

        if (Object.values(elements).some(el => !el)) {
            console.error("Some DOM elements are missing.");
            return;
        }

        const capitalizeCompany = string => {
            if (UPPERCASE_COMPANIES.has(string.toUpperCase())) {
                return string.toUpperCase();
            } else {
                return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
            }
        };

        const displayNotification = message => alert(message);

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
                    let delay = currentSentence[charIndex - 1] === '.' ? 300 : 60;
                    setTimeout(type, delay);
                }
            };

            type();
        };

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;

        recognition.onstart = () => {
            elements.feedbackText.textContent = "Listening...";
            elements.voiceButton.classList.add('voiceButton-listening');
        };

        recognition.onresult = (event) => {
            const company = capitalizeCompany(event.results[event.results.length - 1][0].transcript.trim());
            fetchCompanyData(company);
        };

        recognition.onend = () => {
            elements.feedbackText.textContent = "";
            elements.voiceButton.classList.remove('voiceButton-listening');
        };

        elements.companySearch.addEventListener('input', event => {
            const value = capitalizeCompany(event.target.value.trim());
            event.target.value = value;
        });

        elements.companySearch.addEventListener('keypress', event => {
            if (event.key === 'Enter' && event.target.value.trim() !== '') {
                fetchCompanyData(event.target.value.trim());
            }
        });

        const fetchCompanyData = async company => {
            if (cache.has(company)) {
                processCompanyData(cache.get(company));
                return;
            }

            const encodedCompany = encodeURIComponent(company);
            try {
                const response = await fetch(`${API_ENDPOINT}${encodedCompany}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                cache.set(company, data);
                processCompanyData(data);
            } catch (error) {
                console.error(`Failed to fetch company data:`, error);
                displayNotification(`Failed to fetch data for ${company}. Please try again.`);
            }
        };

        const processCompanyData = data => {
            if (!data || !data.name) {
                displayNotification('Company not found. Please try a different search.');
                return;
            }

            const companyName = capitalizeCompany(data.name);
            const phoneNumber = data.number;

            if (phoneNumber && phoneNumber !== "NA") {
                const messageContent = `${companyName}: ${phoneNumber}. Would you like to dial this number?`;
                if (confirm(messageContent)) {
                    window.location.href = `tel:${phoneNumber}`;
                }
            } else {
                displayNotification(`${companyName} does not have a phone number available.`);
            }
        };

        typingEffect();
    })();
});
