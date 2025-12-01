import { formatChartDate, groupByDay } from './dateHelpers';

/**
 * Process project history for timeline chart
 */
export const processTimelineData = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) {
        return [];
    }

    return history.map(entry => ({
        date: formatChartDate(entry.timestamp),
        timestamp: entry.timestamp,
        total: entry.metrics?._summary?.annotated_images || 0,  // Access through metrics
        annotated: entry.metrics?._summary?.annotated_images || 0,
        ...entry
    }));
};

/**
 * Process class distribution for pie chart
 */
export const processClassDistribution = (metrics) => {
    if (!metrics) return [];

    return Object.entries(metrics)
        .filter(([key]) => key !== '_summary')
        .map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: data.image_count || 0,
            annotated: data.annotated_count || 0
        }))
        .filter(item => item.value > 0);
};

/**
 * Process checkpoint comparison data
 */
export const processCheckpointComparison = (current, checkpoint) => {
    if (!current || !checkpoint) return [];

    const classes = new Set([
        ...Object.keys(current).filter(k => k !== '_summary'),
        ...Object.keys(checkpoint).filter(k => k !== '_summary')
    ]);

    return Array.from(classes).map(className => ({
        name: className.charAt(0).toUpperCase() + className.slice(1),
        current: current[className]?.image_count || 0,
        checkpoint: checkpoint[className]?.image_count || 0,
        growth: (current[className]?.image_count || 0) - (checkpoint[className]?.image_count || 0)
    }));
};

/**
 * Process modality distribution
 */
export const processModalityData = (combinedData) => {
    if (!combinedData) return [];

    const result = [];
    const modalities = ['OPG', 'Bitewing', 'IOPA'];

    Object.entries(combinedData).forEach(([className, data]) => {
        if (className === 'total') return;

        modalities.forEach(modality => {
            const modalityData = data[modality];
            if (modalityData) {
                result.push({
                    class: className,
                    modality,
                    kaggle: modalityData.kaggle || 0,
                    ls: modalityData.ls || 0,
                    total: modalityData.total || 0
                });
            }
        });
    });

    return result;
};

/**
 * Calculate progress metrics (growth) - tracks ANNOTATED images
 */
export const calculateProgressMetrics = (history) => {
    if (!history || history.length === 0) {
        return { today: 0, yesterday: 0, week: 0, month: 0 };
    }

    // Get current annotated count (most recent entry)
    const currentAnnotated = history[history.length - 1]?.metrics?._summary?.annotated_images || 0;

    // Helper to find annotated count at or before a specific date
    const getAnnotatedAtOrBeforeDate = (targetDate) => {
        // Find the last entry before or at the target date
        let closestEntry = null;
        for (let i = history.length - 1; i >= 0; i--) {
            const entryDate = new Date(history[i].timestamp);
            if (entryDate <= targetDate) {
                closestEntry = history[i];
                break;
            }
        }
        return closestEntry?.metrics?._summary?.annotated_images || 0;
    };

    const now = new Date();

    // Start of Today (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of Yesterday
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Start of This Week (Sunday)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Start of This Month (1st)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate annotated counts at each point
    const annotatedStartToday = getAnnotatedAtOrBeforeDate(startOfToday);
    const annotatedStartYesterday = getAnnotatedAtOrBeforeDate(startOfYesterday);
    const annotatedStartWeek = getAnnotatedAtOrBeforeDate(startOfWeek);
    const annotatedStartMonth = getAnnotatedAtOrBeforeDate(startOfMonth);

    // Calculate growth in annotations
    const todayGrowth = Math.max(0, currentAnnotated - annotatedStartToday);
    const yesterdayGrowth = Math.max(0, annotatedStartToday - annotatedStartYesterday);
    const weekGrowth = Math.max(0, currentAnnotated - annotatedStartWeek);
    const monthGrowth = Math.max(0, currentAnnotated - annotatedStartMonth);

    console.log('Progress Metrics Debug (Annotated Images):', {
        currentAnnotated,
        startOfToday: startOfToday.toISOString(),
        annotatedStartToday,
        todayGrowth,
        yesterdayGrowth,
        weekGrowth,
        monthGrowth,
        historyLength: history.length,
        latestTimestamp: history[history.length - 1]?.timestamp
    });

    return {
        today: todayGrowth,
        yesterday: yesterdayGrowth,
        week: weekGrowth,
        month: monthGrowth
    };
};

/**
 * Process category timeline data
 */
export const processCategoryTimeline = (categoryHistory) => {
    if (!categoryHistory || !Array.isArray(categoryHistory)) return [];

    return categoryHistory.map(entry => ({
        date: formatChartDate(entry.timestamp),
        timestamp: entry.timestamp,
        total: entry.total_images || 0,
        ...entry
    }));
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
};

/**
 * Format percentage
 */
export const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0%';
    return `${value.toFixed(1)}%`;
};
