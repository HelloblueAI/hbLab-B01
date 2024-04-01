document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const API_ENDPOINT = 'https://hblab-399712.uw.r.appspot.com/api/company?name=';
    const cache = new Map();

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

    const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

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
                let delay = currentSentence.substring(charIndex - 1, charIndex) === '.' ? 300 : 60;
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
        const company = capitalizeFirstLetter(event.results[event.results.length - 1][0].transcript);
        fetchCompanyData(company);
    };

    recognition.onerror = (event) => {
        let errorMessage = "An error occurred with voice recognition.";

        switch (event.error) {
            case "no-speech":
                errorMessage = "No speech was detected. Please try again.";
                break;
            case "aborted":
                errorMessage = "Voice recognition was aborted. Please try again.";
                break;
            case "audio-capture":
                errorMessage = "Microphone is not accessible. Please ensure you've granted the necessary permissions.";
                break;
            case "network":
                errorMessage = "Network issues prevented voice recognition. Please check your connection.";
                break;
            case "not-allowed":
                errorMessage = "Permission to access microphone was denied. Please allow access to use this feature.";
                break;
            case "service-not-allowed":
                errorMessage = "The speech recognition feature is not supported by Instagram browser. For company searches, use your keyboard. Please visit helloblue.ai for the speech recognition feature.";
                break;
            default:
                break;
        }

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

        elements.voiceButton.addEventListener('click', (event) => {
            if (event.target.classList.contains('voiceButton-listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    };

    const setupCompanySearchListener = () => {
        elements.companySearch.addEventListener('input', event => {
            const value = event.target.value;
            event.target.value = capitalizeFirstLetter(value);
        });

        elements.companySearch.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                fetchCompanyData(capitalizeFirstLetter(e.target.value));
            }
        });
    };

    const fetchCompanyData = async company => {
        recognition.stop(); // Explicitly stop the recognition service
        elements.feedbackText.textContent = "";
        elements.voiceButton.classList.remove('voiceButton-listening');

        if (cache.has(company)) {
            processCompanyData(cache.get(company));
            return;
        }

        const encodedCompany = encodeURIComponent(company);
        try {
            const response = await fetch(`${API_ENDPOINT}${encodedCompany}`);
            if (response.ok) {
                const data = await response.json();
                cache.set(company, data);
                processCompanyData(data);
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            displayNotification(`An error occurred while fetching company data: ${error.message}`);
        }
    };

    const processCompanyData = data => {
        if (data.error) {
            displayNotification(data.error);
            return;
        }

        elements.companyNameSpan.textContent = `You asked to call: ${capitalizeFirstLetter(data.name)}`;
        handleCompanyActions(data);
    };

    const handleCompanyActions = data => {
        const correctedCompanyName = capitalizeFirstLetter(data.name);
        if (data.number && data.number !== "NA") {
            const message = `${correctedCompanyName}: ${data.number}. Would you like to dial this number?`;
            if (confirm(message)) {
                if (isValidURL(data.url)) {
                    window.location.href = data.url;
                } else {
                    window.location.href = `tel:${data.number.replace(/[^0-9]/g, '')}`;
                }
            }
        } else {
            displayNotification('Company not found or no available actions.');
        }
    };

    typingEffect();
    setupVoiceRecognition();
    setupCompanySearchListener();
})();
