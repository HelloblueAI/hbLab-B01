document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    (async () => {
        const API_ENDPOINT = 'https://hblab-399712.uw.r.appspot.com/api/company?name=';
        const cache = new Map();
        let activeEffect = 'intro';

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

        const capitalizeCompany = string => UPPERCASE_COMPANIES.has(string.toUpperCase()) ?
            string.toUpperCase() :
            string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

        const displayNotification = message => alert(message);

        const isValidURL = string => {
            try {
                new URL(string);
                return true;
            } catch {
                return false;
            }
        };

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        const typesentence = async (sentence, effectType) => {
            for (let i = 0; i <= sentence.length; i++) {
                if (activeEffect !== effectType) break;
                elements.typedOutput.textContent = sentence.substring(0, i);
                await delay(sentence[i - 1] === '.' ? 300 : 120);
            }
        };

        const introTypingEffect = async () => {
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
                await typesentence(sentence, 'intro');
                await delay(1500);
            }
            if (activeEffect === 'intro') introTypingEffect();
        };

        elements.companySearch.addEventListener('focus', () => {
            introTypingEffect();
        });

        elements.companySearch.addEventListener('input', event => {
            event.target.value = capitalizeCompany(event.target.value.trim());
        });

        elements.companySearch.addEventListener('keypress', async event => {
            if (event.key === 'Enter' && event.target.value.trim() !== '') {
                const company = capitalizeCompany(event.target.value.trim());
                await fetchCompanyData(company);
            }
        });

        const fetchCompanyData = async company => {
            elements.feedbackText.textContent = "";
            if (cache.has(company)) {
                await displayCompanyTypingEffect(cache.get(company).name, cache.get(company).number, cache.get(company).url);
                return;
            }

            try {
                const response = await fetch(`${API_ENDPOINT}${encodeURIComponent(company)}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                cache.set(company, data);
                await displayCompanyTypingEffect(data.name, data.number, data.url);
            } catch (error) {
                console.error(`Failed to fetch company data:`, error);
                displayNotification(`Failed to fetch data for ${company}. Please try again.`);
            }
        };

        const displayCompanyTypingEffect = async (companyName, phoneNumber, url) => {
            activeEffect = 'company';
            const sentence = `You asked to call: ${companyName}`;
            elements.typedOutput.textContent = '';
            elements.companyNameSpan.classList.remove('hidden');
            await typesentence(sentence, 'company');
            handleCompanyActions(companyName, phoneNumber, url);
        };

        const handleCompanyActions = (companyName, phoneNumber, url) => {
            if (phoneNumber && phoneNumber !== "NA") {
                const messageContent = `${companyName}: ${phoneNumber}. Would you like to dial this number?`;
                if (confirm(messageContent)) {
                    window.location.href = isValidURL(url) ? url : `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
                }
            } else {
                displayNotification(`${companyName} does not have a phone number available.`);
            }
        };

        const setupVoiceRecognition = () => {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = false;

            recognition.onstart = () => {
                elements.feedbackText.textContent = "Listening...";
                elements.voiceButton.classList.add('voiceButton-listening');
            };

            recognition.onresult = async (event) => {
                const company = capitalizeCompany(event.results[0][0].transcript.trim());
                elements.companySearch.value = company;
                await fetchCompanyData(company);
            };

            recognition.onerror = (event) => {
                displayNotification("Error occurred in recognition: " + event.error);
            };

            recognition.onend = () => {
                elements.feedbackText.textContent = "";
                elements.voiceButton.classList.remove('voiceButton-listening');
            };

            elements.voiceButton.onclick = () => {
                if (recognition && recognition.start) {
                    recognition.start();
                } else {
                    displayNotification("Voice recognition not supported.");
                }
            };
        };

        setupVoiceRecognition();
        introTypingEffect();
    })();
});
