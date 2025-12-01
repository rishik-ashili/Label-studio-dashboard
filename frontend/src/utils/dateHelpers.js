// Date and time helper functions for chart data processing

/**
 * Get date range for time period
 */
export const getDateRange = (period) => {
    const now = new Date();
    const ranges = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        yesterday: new Date(now.setDate(now.getDate() - 1)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setDate(now.getDate() - 30))
    };

    return ranges[period] || now;
};

/**
 * Count items in date range
 */
export const countInRange = (history, startDate, endDate) => {
    if (!history || !Array.isArray(history)) return 0;

    return history.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
    }).length;
};

/**
 * Calculate daily, weekly, monthly metrics
 */
export const calculateTimeMetrics = (history) => {
    if (!history || !Array.isArray(history)) {
        return { today: 0, yesterday: 0, lastWeek: 0, lastMonth: 0 };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // Get latest value in each range
    const getLatestInRange = (start, end) => {
        const entriesInRange = history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate < end;
        });

        if (entriesInRange.length === 0) return 0;

        // Get the latest entry's total count
        const latest = entriesInRange[entriesInRange.length - 1];
        return latest._summary?.total_images || 0;
    };

    return {
        today: getLatestInRange(today, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
        yesterday: getLatestInRange(yesterday, today),
        lastWeek: getLatestInRange(oneWeekAgo, new Date()),
        lastMonth: getLatestInRange(oneMonthAgo, new Date())
    };
};

/**
 * Format date for chart display
 */
export const formatChartDate = (timestamp, format = 'short') => {
    const date = new Date(timestamp);

    if (format === 'short') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (format === 'full') {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (format === 'time') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString();
};

/**
 * Group history data by day
 */
export const groupByDay = (history) => {
    if (!history || !Array.isArray(history)) return [];

    const grouped = {};

    history.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (!grouped[dayKey]) {
            grouped[dayKey] = {
                date: dayKey,
                timestamp: entry.timestamp,
                count: 0,
                ...entry
            };
        }

        grouped[dayKey].count = entry._summary?.total_images || grouped[dayKey].count;
    });

    return Object.values(grouped);
};

/**
 * Get last N days of data
 */
export const getLastNDays = (history, days = 30) => {
    if (!history || !Array.isArray(history)) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.filter(entry => new Date(entry.timestamp) >= cutoffDate);
};
