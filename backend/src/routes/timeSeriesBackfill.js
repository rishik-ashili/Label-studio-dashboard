import express from 'express';
import { backfillTimeSeriesFromHistory } from '../services/timeSeriesService.js';

const router = express.Router();

/**
 * POST /api/time-series/backfill
 * Backfill time-series data from persistent_metrics history
 */
router.post('/backfill', async (req, res) => {
    try {
        const result = await backfillTimeSeriesFromHistory();
        res.json(result);
    } catch (error) {
        console.error('Error backfilling time-series:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to backfill time-series data',
            message: error.message
        });
    }
});

export default router;
