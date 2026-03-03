import axios from 'axios';

const chatbotApi = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

export const chatbotService = {
    /**
     * Login to the chatbot API and get a session ID.
     */
    login: async (email, password) => {
        const response = await chatbotApi.post('/auth/login', { email, password });
        return response.data;
    },

    /**
     * Login to the chatbot using a JWT token.
     */
    tokenLogin: async (token) => {
        const response = await chatbotApi.post('/auth/token-login', { token });
        return response.data;
    },

    /**
     * Send a chat message. Requires a valid session ID.
     */
    sendMessage: async (sessionId, message) => {
        const response = await chatbotApi.post(
            '/chat',
            { message },
            { headers: { 'X-Session-ID': sessionId } }
        );
        return response.data;
    },

    /**
     * Get conversation history for the current session.
     */
    getHistory: async (sessionId, limit = 50) => {
        const response = await chatbotApi.get('/history', {
            params: { limit },
            headers: { 'X-Session-ID': sessionId },
        });
        return response.data;
    },

    /**
     * Start a new chat session (resets current context).
     */
    startNewChat: async (sessionId) => {
        const response = await chatbotApi.post(
            '/conversations/new',
            {},
            { headers: { 'X-Session-ID': sessionId } }
        );
        return response.data;
    },

    /**
     * List all past conversations for the user.
     */
    getConversations: async (sessionId) => {
        const response = await chatbotApi.get('/conversations', {
            headers: { 'X-Session-ID': sessionId },
        });
        return response.data;
    },

    /**
     * Load a specific past conversation.
     */
    loadConversation: async (sessionId, conversationId) => {
        const response = await chatbotApi.post(
            `/conversations/${conversationId}/load`,
            {},
            { headers: { 'X-Session-ID': sessionId } }
        );
        return response.data;
    },

    /**
     * Get message history for a specific conversation.
     */
    getConversationMessages: async (sessionId, conversationId) => {
        const response = await chatbotApi.get(
            `/conversations/${conversationId}/messages`,
            { headers: { 'X-Session-ID': sessionId } }
        );
        return response.data;
    },

    /**
     * Logout from the chatbot and destroy the session.
     */
    logout: async (sessionId) => {
        const response = await chatbotApi.post(
            '/auth/logout',
            {},
            { headers: { 'X-Session-ID': sessionId } }
        );
        return response.data;
    },

    /**
     * Check if the chatbot API is healthy.
     */
    healthCheck: async () => {
        try {
            const response = await chatbotApi.get('/health');
            return response.data;
        } catch {
            return { status: 'unreachable', database_connected: false };
        }
    },
};

export default chatbotService;
