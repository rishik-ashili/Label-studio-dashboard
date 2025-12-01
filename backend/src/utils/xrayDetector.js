import { XRAY_TYPES } from './constants.js';

/**
 * Detect X-ray type from project title
 * Matches Python: detect_xray_type()
 */
export const detectXrayType = (projectTitle) => {
    if (!projectTitle) return 'Others';

    const titleLower = projectTitle.toLowerCase();

    for (const [xrayType, keywords] of Object.entries(XRAY_TYPES)) {
        for (const keyword of keywords) {
            if (titleLower.includes(keyword)) {
                return xrayType;
            }
        }
    }

    return 'Others';
};
