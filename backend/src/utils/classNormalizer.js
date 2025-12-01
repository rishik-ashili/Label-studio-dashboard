/**
 * Normalize class names by removing trailing numbers
 * Matches Python: normalize_class_name()
 */
export const normalizeClassName = (className) => {
    if (!className) return '';

    const normalized = className.trim().toLowerCase();
    const match = normalized.match(/^([a-zA-Z\s]+)(\s+\d+)?$/);

    if (match) {
        return match[1].trim();
    }

    return normalized;
};
