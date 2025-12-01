import express from 'express';
import { getCombinedMetrics } from '../controllers/metricsController.js';

const router = express.Router();

// Get combined Kaggle + Label Studio metrics
router.get('/combined', getCombinedMetrics);

export default router;
