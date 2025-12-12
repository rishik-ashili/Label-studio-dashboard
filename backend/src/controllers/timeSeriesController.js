import { getTimeSeriesData, calculateDailyDeltas, getPresetRange } from '../services/timeSeriesService.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';

/**
 * Time Series Controller
 * Handles time-series API endpoints for modality-class tracking
 */

export const getTimeSeriesMetrics = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;

        let queryStartDate, queryEndDate;

        // Determine date range
        if (startDate && endDate) {
            // Custom range
            queryStartDate = startDate;
            queryEndDate = endDate;
        } else if (range) {
            // Preset range (24h, 7d, 30d)
            const presetDates = getPresetRange(range);
            queryStartDate = presetDates.startDate;
            queryEndDate = presetDates.endDate;
        } else {
            // Default to 7 days
            const presetDates = getPresetRange('7d');
            queryStartDate = presetDates.startDate;
            queryEndDate = presetDates.endDate;
        }

        // Get raw time series data
        const rawMetrics = await getTimeSeriesData(queryStartDate, queryEndDate);

        // Calculate daily deltas
        const metricsWithDeltas = calculateDailyDeltas(rawMetrics);

        // Add category information
        const enrichedMetrics = metricsWithDeltas.map(metric => {
            let category = 'Others';
            for (const [cat, classes] of Object.entries(CLASS_CATEGORIES)) {
                if (classes.includes(metric.className)) {
                    category = cat;
                    break;
                }
            }
            return { ...metric, category };
        });

        // Sort by total images descending
        enrichedMetrics.sort((a, b) => b.totalImages - a.totalImages);

        // Get server time
        const serverTime = new Date().toISOString();

        res.json({
            success: true,
            serverTime,
            timeRange: {
                from: queryStartDate,
                to: queryEndDate,
                days: Math.ceil((new Date(queryEndDate) - new Date(queryStartDate)) / (1000 * 60 * 60 * 24))
            },
            count: enrichedMetrics.length,
            metrics: enrichedMetrics
        });

    } catch (error) {
        console.error('Error fetching time series metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch time series metrics',
            message: error.message
        });
    }
};
