import express from 'express';
import { processMessage } from '../services/geminiService.js';
import { logInfo, logError } from '../utils/logger.js';

const router = express.Router();

// In-memory conversation storage (could be moved to file/database)
const conversations = new Map();

/**
 * POST /api/chat/message
 * Send a message to the AI chatbot
 */
router.post('/message', async (req, res) => {
    try {
        const { message, conversationId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        logInfo('chat:api', `Processing message for conversation ${conversationId}`);

        // Get conversation history
        const history = conversations.get(conversationId) || [];

        // Process message with Gemini
        const result = await processMessage(message, history);

        // Store updated conversation
        conversations.set(conversationId, result.conversationHistory);

        res.json({
            response: result.response,
            functionCalls: result.functionCalls,
            conversationId
        });

    } catch (error) {
        logError('chat:api', 'Error processing chat message', { error: error.message });
        res.status(500).json({
            error: 'Failed to process message',
            details: error.message
        });
    }
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history
 */
router.get('/history/:conversationId', (req, res) => {
    try {
        const { conversationId } = req.params;
        const history = conversations.get(conversationId) || [];

        res.json({
            conversationId,
            messages: history
        });

    } catch (error) {
        logError('chat:api', 'Error fetching chat history', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * DELETE /api/chat/history/:conversationId
 * Clear conversation history
 */
router.delete('/history/:conversationId', (req, res) => {
    try {
        const { conversationId } = req.params;
        conversations.delete(conversationId);

        logInfo('chat:api', `Cleared conversation ${conversationId}`);

        res.json({ success: true });

    } catch (error) {
        logError('chat:api', 'Error clearing chat history', { error: error.message });
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

/**
 * GET /api/chat/conversations
 * List all conversation IDs
 */
router.get('/conversations', (req, res) => {
    try {
        const conversationIds = Array.from(conversations.keys());

        res.json({
            conversations: conversationIds,
            count: conversationIds.length
        });

    } catch (error) {
        logError('chat:api', 'Error listing conversations', { error: error.message });
        res.status(500).json({ error: 'Failed to list conversations' });
    }
});

export default router;
