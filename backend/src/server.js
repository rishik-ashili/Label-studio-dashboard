import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import projectsRoutes from './routes/projects.js';
import checkpointsRoutes from './routes/checkpoints.js';
import notificationsRoutes from './routes/notifications.js';
import schedulerRoutes from './routes/scheduler.js';
import categoriesRoutes from './routes/categories.js';
import metricsRoutes from './routes/metrics.js';

// Import services (to initialize)
import storage from './storage/fileStorage.js';
import schedulerService from './services/schedulerService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/projects', projectsRoutes);
app.use('/api/checkpoints', checkpointsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/metrics', metricsRoutes);

// Kaggle data endpoints
app.get('/api/kaggle', async (req, res) => {
    try {
        const data = await storage.loadKaggleData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/kaggle/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const data = await storage.loadKaggleData();

        data[category] = req.body;
        await storage.saveKaggleData(data);

        res.json({ success: true });
    } catch (error) {
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
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Label Studio Dashboard API running on port ${PORT}`);
    console.log(`📊 Label Studio URL: ${process.env.LABEL_STUDIO_URL}`);
    console.log(`📁 Cache directory: ${process.env.CACHE_DIR || './storage/cache'}`);
});
