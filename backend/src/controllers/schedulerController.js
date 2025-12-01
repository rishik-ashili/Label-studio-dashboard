import storage from '../storage/fileStorage.js';
import schedulerService from '../services/schedulerService.js';

// GET /api/scheduler/status - Get scheduler status
export const getStatus = async (req, res) => {
    try {
        const status = await schedulerService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/scheduler/start - Start scheduler
export const startScheduler = async (req, res) => {
    try {
        const { hour, minute } = req.body;
        const success = await schedulerService.start(hour || 2, minute || 8);
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/scheduler/stop - Stop scheduler
export const stopScheduler = async (req, res) => {
    try {
        const success = await schedulerService.stop();
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/scheduler/trigger - Trigger manual refresh
export const triggerManual = async (req, res) => {
    try {
        const success = await schedulerService.triggerManual();
        res.json({ success, message: 'Manual refresh started in background' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/scheduler/logs - Get recent logs
export const getLogs = async (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 50;
        const logs = await storage.getSchedulerLogs(lines);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
