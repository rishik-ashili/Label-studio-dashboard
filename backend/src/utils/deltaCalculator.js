/**
 * Calculate delta between current and previous metrics
 * Matches Python: calculate_delta()
 */
export const calculateDelta = (current, previous) => {
    if (!previous) return null;

    const delta = {};
    const allClasses = new Set([
        ...Object.keys(current || {}),
        ...Object.keys(previous || {})
    ]);

    // Remove _summary from class set
    allClasses.delete('_summary');

    for (const className of allClasses) {
        const curr = current[className] || { image_count: 0, annotation_count: 0 };
        const prev = previous[className] || { image_count: 0, annotation_count: 0 };

        delta[className] = {
            image_count_delta: (curr.image_count || 0) - (prev.image_count || 0),
            annotation_count_delta: (curr.annotation_count || 0) - (prev.annotation_count || 0)
        };
    }

    // Calculate summary delta
    const currSummary = current._summary || {};
    const prevSummary = previous._summary || {};

    delta._summary = {
        total_images_delta: (currSummary.total_images || 0) - (prevSummary.total_images || 0),
        annotated_images_delta: (currSummary.annotated_images || 0) - (prevSummary.annotated_images || 0)
    };

    return delta;
};

/**
 * Calculate percentage increase
 */
export const calculateIncreasePct = (current, checkpoint) => {
    if (!checkpoint || checkpoint === 0) return 0;
    return ((current - checkpoint) / checkpoint) * 100;
};
