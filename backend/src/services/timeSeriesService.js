import storage from '../storage/fileStorage.js';
import { getAllModalities } from './modalityService.js';

/**
 * Time Series Service
 * Tracks modality-class metrics over time with daily snapshots
 */

/**
 * Get current totals for all modality-class combinations
 * Used to create daily snapshots
 */
export const getCurrentModalityClassTotals = async () => {
    const persistentDB = await storage.loadPersistentDB();
    const modalities = await getAllModalities();

    const modalityClassTotals = {};

    // Process each project
    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const history = projectData.history || [];
        if (history.length === 0) continue;

        const latestMetrics = history[history.length - 1].metrics;
        const modality = modalities[projectId] || 'Others';

        // Process each class
        for (const [className, classData] of Object.entries(latestMetrics)) {
            if (className === '_summary') continue;

            const key = `${className}-${modality}`;

            if (!modalityClassTotals[key]) {
                modalityClassTotals[key] = {
                    images: 0,
                    annotations: 0
                };
            }

            modalityClassTotals[key].images += classData.image_count || 0;
            modalityClassTotals[key].annotations += classData.annotation_count || 0;
        }
    }

    return modalityClassTotals;
};

/**
 * Store daily snapshot of modality-class totals
 */
export const storeSnapshot = async () => {
    const totals = await getCurrentModalityClassTotals();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const timeSeries = await storage.loadTimeSeries();
    timeSeries[today] = totals;

    await storage.saveTimeSeries(timeSeries);

    return { date: today, metrics: totals };
};

/**
 * Get time series data for a date range
 */
export const getTimeSeriesData = async (startDate, endDate) => {
    const timeSeries = await storage.loadTimeSeries();
    const modalities = await getAllModalities();
    const persistentDB = await storage.loadPersistentDB();

    // Filter by date range
    const filtered = {};
    for (const [date, metrics] of Object.entries(timeSeries)) {
        if (date >= startDate && date <= endDate) {
            filtered[date] = metrics;
        }
    }

    // Group by modality-class with daily data
    const result = {};

    for (const [date, metrics] of Object.entries(filtered)) {
        for (const [modalityClass, data] of Object.entries(metrics)) {
            if (!result[modalityClass]) {
                const [className, modality] = modalityClass.split('-');
                result[modalityClass] = {
                    modalityClass,
                    className,
                    modality,
                    dailyData: []
                };
            }

            result[modalityClass].dailyData.push({
                date,
                images: data.images,
                annotations: data.annotations
            });
        }
    }

    // Sort daily data by date descending
    for (const metric of Object.values(result)) {
        metric.dailyData.sort((a, b) => b.date.localeCompare(a.date));
    }

    return Object.values(result);
};

/**
 * Calculate day-over-day deltas for time series data
 */
export const calculateDailyDeltas = (metrics) => {
    return metrics.map(metric => {
        const dailyDataWithDeltas = metric.dailyData.map((day, index) => {
            if (index === metric.dailyData.length - 1) {
                // First day (oldest) - no previous day
                return {
                    ...day,
                    imagesDelta: 0,
                    annotationsDelta: 0
                };
            }

            const previousDay = metric.dailyData[index + 1];
            return {
                ...day,
                imagesDelta: day.images - previousDay.images,
                annotationsDelta: day.annotations - previousDay.annotations
            };
        });

        // Calculate current totals (most recent day)
        const latestDay = dailyDataWithDeltas[0] || {};

        return {
            ...metric,
            totalImages: latestDay.images || 0,
            totalAnnotations: latestDay.annotations || 0,
            dailyData: dailyDataWithDeltas
        };
    });
};

/**
 * Get preset time range dates
 */
export const getPresetRange = (preset) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();

    switch (preset) {
        case '24h':
            startDate.setDate(startDate.getDate() - 1);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7); // Default to 7 days
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate
    };
};

/**
 * Backfill time-series data from persistent_metrics history
 * This populates the time_series_metrics.json with historical data
 */
export const backfillTimeSeriesFromHistory = async () => {
    try {
        console.log('🔄 Starting time-series backfill from persistent_metrics history...');

        const persistentDB = await storage.loadPersistentDB();
        const modalities = await getAllModalities();
        const timeSeries = await storage.loadTimeSeries();

        // Group metrics by date
        const dailySnapshots = {};

        // Process each project's history
        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const history = projectData.history || [];
            const modality = modalities[projectId] || 'Others';

            history.forEach(entry => {
                const date = entry.timestamp.split('T')[0]; // Extract YYYY-MM-DD

                if (!dailySnapshots[date]) {
                    dailySnapshots[date] = {};
                }

                // Process each class in this entry
                Object.entries(entry.metrics).forEach(([className, classData]) => {
                    if (className === '_summary') return;

                    const modalityClassKey = `${className}-${modality}`;

                    if (!dailySnapshots[date][modalityClassKey]) {
                        dailySnapshots[date][modalityClassKey] = {
                            images: 0,
                            annotations: 0
                        };
                    }

                    // Aggregate across projects for this date
                    dailySnapshots[date][modalityClassKey].images += classData.image_count || 0;
                    dailySnapshots[date][modalityClassKey].annotations += classData.annotation_count || 0;
                });
            });
        }

        // Merge with existing time-series (don't overwrite existing data)
        const mergedTimeSeries = { ...dailySnapshots, ...timeSeries };

        // Save merged data
        await storage.saveTimeSeries(mergedTimeSeries);

        const dates = Object.keys(dailySnapshots).sort();
        console.log(`✅ Backfill complete! Added ${dates.length} days of historical data`);
        console.log(`   Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
        console.log(`   Total dates in time-series: ${Object.keys(mergedTimeSeries).length}`);

        return {
            success: true,
            datesAdded: dates.length,
            dateRange: {
                start: dates[0],
                end: dates[dates.length - 1]
            },
            totalDates: Object.keys(mergedTimeSeries).length
        };
    } catch (error) {
        console.error('Error in backfillTimeSeriesFromHistory:', error);
        throw error;
    }
};
