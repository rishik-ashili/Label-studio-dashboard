/**
 * Calculate delta between current and previous metrics
 */
export const calculateDelta = (current, previous) => {
    if (!previous) return null;

    const delta = {};
    const allClasses = new Set([
        ...Object.keys(current || {}),
        ...Object.keys(previous || {})
    ]);

    allClasses.delete('_summary');

    for (const className of allClasses) {
        const curr = current[className] || { image_count: 0, annotation_count: 0 };
        const prev = previous[className] || { image_count: 0, annotation_count: 0 };

        delta[className] = {
            image_count_delta: (curr.image_count || 0) - (prev.image_count || 0),
            annotation_count_delta: (curr.annotation_count || 0) - (prev.annotation_count || 0)
        };
    }

    return delta;
};

/**
 * Format timestamp to relative time
 */
export const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * Format date to readable string
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
    return num.toLocaleString();
};
