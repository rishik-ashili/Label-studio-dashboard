import storage from '../storage/fileStorage.js';
import { dismissNotification } from '../services/notificationService.js';

// GET /api/notifications - Get all notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await storage.loadNotifications();
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/notifications/:index - Dismiss notification
export const dismissNotif = async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const success = await dismissNotification(storage, index);
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
