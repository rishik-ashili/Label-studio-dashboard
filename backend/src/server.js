import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import projectsRoutes from './routes/projects.js';
import checkpointsRoutes from './routes/checkpoints.js';
import notificationsRoutes from './routes/notifications.js';
import growthRoutes from './routes/growth.js';
import timeSeriesRoutes from './routes/timeSeries.js';
import timeSeriesBackfillRoutes from './routes/timeSeriesBackfill.js';
import schedulerRoutes from './routes/scheduler.js';
import categoriesRoutes from './routes/categories.js';
import metricsRoutes from './routes/metrics.js';
import logRoutes, { logToRecent } from './routes/logRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import modalitiesRoutes from './routes/modalities.js';

// Import services (to initialize)
import storage from './storage/fileStorage.js';
import schedulerService from './services/schedulerService.js';
import { requestLogger, errorLogger, logInfo } from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger); // Add request logging

// API Routes
app.use('/api/projects', projectsRoutes);
app.use('/api/checkpoints', checkpointsRoutes);
app.use('/api/notifications', notificationsRoutes); // Keep for backward compatibility
app.use('/api/growth', growthRoutes); // New growth endpoint
app.use('/api/time-series', timeSeriesRoutes); // Time series endpoint
app.use('/api/time-series', timeSeriesBackfillRoutes); // Backfill endpoint
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/logs', logRoutes); // Add logs API
app.use('/api/chat', chatRoutes); // Add chat API
app.use('/api/modalities', modalitiesRoutes); // Add modalities API

// Kaggle data endpoints
app.get('/api/kaggle', async (req, res) => {
    try {
        logInfo('kaggle:api', 'Fetching Kaggle data');
        const data = await storage.loadKaggleData();
        res.json(data);
    } catch (error) {
        logError('kaggle:api', 'Failed to fetch Kaggle data', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/kaggle/:category', async (req, res) => {
    try {
        const category = req.params.category;
        logInfo('kaggle:api', `Updating Kaggle data for category: ${category}`);

        const data = await storage.loadKaggleData();
        data[category] = req.body;
        await storage.saveKaggleData(data);

        logToRecent('info', 'kaggle:api', `Successfully updated ${category}`, { category });
        res.json({ success: true });
    } catch (error) {
        logError('kaggle:api', 'Failed to update Kaggle data', { error: error.message, category: req.params.category });
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        label_studio_url: process.env.LABEL_STUDIO_URL
    });
});

// Serve static frontend (for production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    });
}

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    const startupMessage = `🚀 Label Studio Dashboard API running on port ${PORT}`;
    console.log(startupMessage);
    console.log(`📊 Label Studio URL: ${process.env.LABEL_STUDIO_URL}`);
    console.log(`📁 Cache directory: ${process.env.CACHE_DIR || './storage/cache'}`);

    logInfo('server', startupMessage, {
        port: PORT,
        labelStudioUrl: process.env.LABEL_STUDIO_URL,
        cacheDir: process.env.CACHE_DIR || './storage/cache'
    });

    logToRecent('info', 'server', 'Server started successfully', { port: PORT });
});
