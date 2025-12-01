// Color palette for consistent chart styling
export const CHART_COLORS = {
    // Primary colors
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',

    success: '#10b981',
    successLight: '#34d399',

    warning: '#fbbf24',
    warningLight: '#fcd34d',

    danger: '#ef4444',
    dangerLight: '#f87171',

    purple: '#8b5cf6',
    purpleLight: '#a78bfa',

    cyan: '#06b6d4',
    cyanLight: '#22d3ee',

    pink: '#ec4899',
    orange: '#f97316',

    // Class type colors
    pathology: '#ef4444',
    nonPathology: '#10b981',
    toothParts: '#3b82f6',
    others: '#8b5cf6',

    // Modality colors
    opg: '#3b82f6',
    bitewing: '#8b5cf6',
    iopa: '#06b6d4',

    // Source colors
    kaggle: '#fbbf24',
    labelStudio: '#3b82f6',

    // Category colors
    Pathology: '#ef4444',
    'Non-Pathology': '#10b981',
    'Tooth Parts': '#3b82f6',
    Others: '#8b5cf6',

    // Neutral colors
    gray: '#64748b',
    grayLight: '#94a3b8',
    grayDark: '#475569'
};

// Class name to color mapping
export const getClassColor = (className) => {
    const colorMap = {
        // Pathology
        lesion: CHART_COLORS.danger,
        cavity: CHART_COLORS.dangerLight,

        // Non-Pathology
        bone: CHART_COLORS.success,
        pulp: CHART_COLORS.successLight,

        // Tooth Parts
        tooth: CHART_COLORS.primary,
        filling: CHART_COLORS.primaryLight,
        rootcanal: CHART_COLORS.cyan,

        // Others
        others: CHART_COLORS.purple
    };

    return colorMap[className?.toLowerCase()] || CHART_COLORS.gray;
};

// Category to color mapping
export const getCategoryColor = (category) => {
    return CHART_COLORS[category] || CHART_COLORS.gray;
};

// Modality to color mapping
export const getModalityColor = (modality) => {
    const modalityMap = {
        'OPG': CHART_COLORS.opg,
        'Bitewing': CHART_COLORS.bitewing,
        'IOPA': CHART_COLORS.iopa
    };

    return modalityMap[modality] || CHART_COLORS.gray;
};

// Generate array of colors for multiple series
export const getColorArray = (count) => {
    const colors = [
        CHART_COLORS.primary,
        CHART_COLORS.success,
        CHART_COLORS.warning,
        CHART_COLORS.purple,
        CHART_COLORS.cyan,
        CHART_COLORS.pink,
        CHART_COLORS.orange,
        CHART_COLORS.danger
    ];

    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};
