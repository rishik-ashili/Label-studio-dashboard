import { calculateModalityClassGrowth } from '../services/growthService.js';

/**
 * Growth Controller
 * Handles growth tracking API endpoints
 */

// GET /api/growth - Get modality-class growth metrics with LIVE data
export const getGrowthMetrics = async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold) || 20;

        // Calculate growth metrics using LIVE data from Label Studio
        const metrics = await calculateModalityClassGrowth(threshold);

        res.json({
            threshold,
            metrics,
            count: metrics.length
        });
    } catch (error) {
        console.error('Error calculating growth metrics:', error);
        res.status(500).json({ error: error.message });
    }
};
