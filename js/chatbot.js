/**
 * AI Chatbot Implementation
 * Connects to Hugging Face backend for portfolio Q&A
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatTrigger = document.getElementById('chat-trigger');
    const chatbotWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('chat-send-btn');

    // --- Configuration ---
    const API_URL = 'https://hassankhan00-ai-assistant.hf.space/chat';
    const SESSION_KEY = 'ai_session_id';
    let isTyping = false;

    /**
     * Initializes or retrieves the session ID from localStorage
     */
    function getSessionId() {
        let sessionId = localStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    /**
     * Toggles the chatbot widget visibility
     */
    function toggleChat() {
        const isActive = chatbotWidget.classList.toggle('active');
        chatTrigger.classList.toggle('idle', !isActive);

        if (isActive) {
            chatInput.focus();
            // Initial welcome message if empty
            if (chatMessages.querySelectorAll('.message-bubble').length === 0) {
                setTimeout(() => {
                    appendMessage('ai', "Hi! I'm Hassan's AI assistant. How can I help you today?");
                }, 500);
            }
        }
    }

    /**
     * Sends a message to the AI assistant
     */
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isTyping) return;

        // Add user message to UI
        appendMessage('user', message);
        chatInput.value = '';

        // Show typing indicator
        setLoading(true);

        try {
            // Production fetch with explicit HTTPS absolute URL
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: message,
                    session_id: getSessionId()
                })
            });

            // Log status code for connectivity diagnosis
            console.log("Chatbot API Response Status:", response.status);

            if (!response.ok) {
                // Log raw error body for detailed troubleshooting
                const errorBody = await response.text();
                console.error("Chatbot API Error Body:", errorBody);

                if (response.status === 429 || response.status === 503) {
                    throw new Error("AI service limit reached. Please try again later.");
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Handle session management updates from backend
            if (data.session_id && data.session_id !== getSessionId()) {
                localStorage.setItem(SESSION_KEY, data.session_id);
            }

            // Extract and clean AI response
            const aiText = processAIResponse(data.response);

            // Hide loading and append AI message
            setLoading(false);
            appendMessage('ai', aiText);

        } catch (error) {
            // Detailed fetch exception logging (CORS, network, etc.)
            console.error('Chatbot Fetch Exception:', error);
            setLoading(false);

            // Check for specific rate-limit error message
            const displayMessage = error.message.includes("limit reached")
                ? error.message
                : "I'm having trouble connecting to the AI assistant. Please try again in a moment.";

            appendMessage('ai', displayMessage);
        }
    }

    /**
     * Appends a message bubble to the chat area
     */
    function appendMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${sender}-message`;
        bubble.textContent = text;

        // Insert before typing indicator
        chatMessages.insertBefore(bubble, typingIndicator);

        // Scroll to bottom with smooth effect
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    /**
     * Clean and truncate AI response based on rules
     */
    function processAIResponse(text) {
        if (!text) return "I'm sorry, I couldn't process that.";

        // 1. Remove <think> and reasoning blocks
        let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // 2. Format as a single clean sentence if it's very long
        if (clean.length > 300) {
            const firstSnippet = clean.split(/[.!?]/)[0];
            clean = firstSnippet ? firstSnippet + '.' : clean.substring(0, 297) + '...';
        }

        return clean || "I'm here to help!";
    }

    /**
     * Toggle loading state
     */
    function setLoading(isLoading) {
        isTyping = isLoading;
        if (isLoading) {
            typingIndicator.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            sendBtn.disabled = true;
            chatInput.disabled = true;
        } else {
            typingIndicator.style.display = 'none';
            sendBtn.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    // --- Event Listeners ---
    chatTrigger.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });

    // Enter key also sends message
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    console.log('🤖 Chatbot initialized in production mode');
});

