import express from 'express';
import logger, { logInfo, logError } from '../utils/logger.js';

const router = express.Router();

// In-memory log store for quick access (last 500 logs)
let recentLogs = [];
const MAX_RECENT_LOGS = 500;

// Add log to recent logs store
export const addToRecentLogs = (logEntry) => {
    recentLogs.unshift(logEntry);
    if (recentLogs.length > MAX_RECENT_LOGS) {
        recentLogs = recentLogs.slice(0, MAX_RECENT_LOGS);
    }
};

// Export function to add backend logs to recent logs
export const logToRecent = (level, source, message, context) => {
    addToRecentLogs({
        timestamp: new Date().toISOString(),
        level,
        source: `backend:${source}`,
        message,
        context: context || {}
    });
};

// GET /api/logs/recent - Retrieve recent logs
router.get('/recent', async (req, res) => {
    try {
        const { level, limit = 100, source } = req.query;

        logInfo('logs:api', 'Fetching recent logs', { level, limit, source });

        let logs = [...recentLogs];

        // Filter by level if specified
        if (level && level !== 'all') {
            logs = logs.filter(log => log.level === level);
        }

        // Filter by source if specified
        if (source) {
            logs = logs.filter(log => log.source && log.source.includes(source));
        }

        // Limit results
        logs = logs.slice(0, parseInt(limit));

        res.json({
            logs,
            total: logs.length,
            filtered: level || source ? true : false
        });
    } catch (error) {
        logError('logs:api', 'Failed to fetch recent logs', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// POST /api/logs/frontend - Accept frontend logs
router.post('/frontend', (req, res) => {
    try {
        const logs = Array.isArray(req.body) ? req.body : [req.body];

        logs.forEach(log => {
            const logEntry = {
                timestamp: log.timestamp || new Date().toISOString(),
                level: log.level || 'info',
                source: `frontend:${log.source || 'unknown'}`,
                message: log.message,
                context: log.context || {}
            };

            addToRecentLogs(logEntry);

            // Also log to Winston
            logger.log(logEntry.level, logEntry.message, {
                source: logEntry.source,
                context: logEntry.context
            });
        });

        res.json({ success: true, received: logs.length });
    } catch (error) {
        logError('logs:api', 'Failed to process frontend logs', { error: error.message });
        res.status(500).json({ error: 'Failed to process logs' });
    }
});

// GET /api/logs/download - Download logs as file
router.get('/download', async (req, res) => {
    try {
        const { format = 'json', level, source } = req.query;

        logInfo('logs:api', 'Downloading logs', { format, level, source });

        let logs = [...recentLogs];

        // Apply filters
        if (level && level !== 'all') {
            logs = logs.filter(log => log.level === level);
        }
        if (source) {
            logs = logs.filter(log => log.source && log.source.includes(source));
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=logs-${timestamp}.json`);
            res.json(logs);
        } else {
            // Text format
            const logText = logs.map(log =>
                `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message} ${JSON.stringify(log.context)}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename=logs-${timestamp}.txt`);
            res.send(logText);
        }
    } catch (error) {
        logError('logs:api', 'Failed to download logs', { error: error.message });
        res.status(500).json({ error: 'Failed to download logs' });
    }
});

// GET /api/logs/stats - Get log statistics
router.get('/stats', (req, res) => {
    try {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const recentHourLogs = recentLogs.filter(log => log.timestamp > hourAgo);

        const stats = {
            total: recentLogs.length,
            lastHour: recentHourLogs.length,
            byLevel: {
                error: recentLogs.filter(l => l.level === 'error').length,
                warn: recentLogs.filter(l => l.level === 'warn').length,
                info: recentLogs.filter(l => l.level === 'info').length,
                debug: recentLogs.filter(l => l.level === 'debug').length
            },
            lastHourByLevel: {
                error: recentHourLogs.filter(l => l.level === 'error').length,
                warn: recentHourLogs.filter(l => l.level === 'warn').length,
                info: recentHourLogs.filter(l => l.level === 'info').length,
                debug: recentHourLogs.filter(l => l.level === 'debug').length
            }
        };

        res.json(stats);
    } catch (error) {
        logError('logs:api', 'Failed to get stats', { error: error.message });
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
