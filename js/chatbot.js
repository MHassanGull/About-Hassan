/**
 * AI Chatbot Implementation
 * Connects to Hugging Face backend for portfolio Q&A
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatTrigger = document.getElementById('chat-trigger');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const sendBtn = document.getElementById('chat-send-btn');

    const API_ENDPOINT = 'https://hassankhan00-ai-assistant.hf.space/chat';

    // Toggle Chat
    chatTrigger.addEventListener('click', () => {
        chatWidget.classList.toggle('active');
        chatTrigger.classList.remove('idle');

        if (chatWidget.classList.contains('active')) {
            chatInput.focus();
            // Initial welcome message if empty
            if (chatMessages.children.length === 1) { // Only typing indicator exists
                setTimeout(() => {
                    appendMessage('ai', "Hi! I'm Hassan's AI assistant. How can I help you today?");
                }, 500);
            }
        } else {
            chatTrigger.classList.add('idle');
        }
    });

    chatClose.addEventListener('click', () => {
        chatWidget.classList.remove('active');
        chatTrigger.classList.add('idle');
    });

    // Send Message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();

        if (!message) return;

        // UI Update: User Message
        appendMessage('user', message);
        chatInput.value = '';

        // Show Loading
        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    session_id: getSessionId() // Include session ID
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();

            // Handle session management updates from backend
            if (data.session_id && data.session_id !== getSessionId()) {
                localStorage.setItem(SESSION_KEY, data.session_id);
            }

            const cleanResponse = processAIResponse(data.response);

            appendMessage('ai', cleanResponse);
        } catch (error) {
            console.error('Chat Error:', error);
            appendMessage('ai', "Sorry, I'm having trouble connecting right now. Please try again later.");
        } finally {
            setLoading(false);
        }
    });

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
        if (!text) return "...";

        // 1. Remove <think> and reasoning blocks
        let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // 2. Remove other common reasoning markers or long explanations
        clean = clean.split('\n')[0]; // Take only the first line

        // 3. Truncate if still too long (ensure it's a short clean sentence)
        if (clean.length > 150) {
            const index = clean.indexOf('.', 100);
            if (index !== -1 && index < 180) {
                clean = clean.substring(0, index + 1);
            } else {
                clean = clean.substring(0, 147) + "...";
            }
        }

        return clean || "I'm here to help!";
    }

    /**
     * Toggle loading state
     */
    function setLoading(isLoading) {
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
});
