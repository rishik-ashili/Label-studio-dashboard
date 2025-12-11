import storage from '../storage/fileStorage.js';
import { getAllModalities } from './modalityService.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';

/**
 * Growth Service
 * Calculates modality-class wise growth metrics
 */

/**
 * Calculate growth for all modality-class combinations
 * Returns metrics that exceed the given threshold
 */
export const calculateModalityClassGrowth = async (threshold = 20) => {
    const persistentDB = await storage.loadPersistentDB();
    const checkpoints = await storage.loadCheckpoints();
    const modalities = await getAllModalities();

    const growthMetrics = [];

    // Group by modality-class combination
    const modalityClassData = {};

    // Process each project
    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const history = projectData.history || [];
        if (history.length === 0) continue;

        const latestMetrics = history[history.length - 1].metrics;
        const modality = modalities[projectId] || 'Others';

        // Get checkpoint for this project (may not exist)
        const checkpointData = checkpoints.projects?.[projectId];
        const checkpointMetrics = checkpointData?.metrics || {}; // Empty if no checkpoint

        // Process each class in both current and checkpoint
        const allClasses = new Set([
            ...Object.keys(latestMetrics),
            ...Object.keys(checkpointMetrics)
        ]);

        for (const className of allClasses) {
            if (className === '_summary') continue;

            const currentCount = latestMetrics[className]?.image_count || 0;
            const checkpointCount = checkpointMetrics[className]?.image_count || 0;

            // Create modality-class key
            const key = `${className}-${modality}`;

            if (!modalityClassData[key]) {
                modalityClassData[key] = {
                    className,
                    modality,
                    currentCount: 0,
                    checkpointCount: 0,
                    contributingProjects: []
                };
            }

            modalityClassData[key].currentCount += currentCount;
            modalityClassData[key].checkpointCount += checkpointCount;

            // Track project contribution if there's current or checkpoint data
            if (currentCount > 0 || checkpointCount > 0) {
                const projectGrowthPct = checkpointCount > 0
                    ? ((currentCount - checkpointCount) / checkpointCount) * 100
                    : (currentCount > 0 ? 100 : 0);

                modalityClassData[key].contributingProjects.push({
                    projectId: parseInt(projectId),
                    projectTitle: `Project ${projectId}`, // Will be enriched by frontend
                    currentCount,
                    checkpointCount,
                    growthPct: Math.round(projectGrowthPct * 10) / 10,
                    growthCount: currentCount - checkpointCount
                });
            }
        }
    }

    // Calculate growth percentages and filter by threshold
    for (const [key, data] of Object.entries(modalityClassData)) {
        const { className, modality, currentCount, checkpointCount, contributingProjects } = data;

        // Skip if no current data
        if (currentCount === 0) continue;

        let growthPct;
        let growthCount = currentCount - checkpointCount;

        if (checkpointCount === 0) {
            // NEW item - no checkpoint baseline, treat as 100% growth
            growthPct = 100;
        } else {
            // Normal calculation
            growthPct = ((currentCount - checkpointCount) / checkpointCount) * 100;
        }

        // Only include if growth meets threshold
        if (growthPct >= threshold) {
            // Find category for this class
            let category = 'Others';
            for (const [cat, classes] of Object.entries(CLASS_CATEGORIES)) {
                if (classes.includes(className)) {
                    category = cat;
                    break;
                }
            }

            growthMetrics.push({
                modalityClass: key,
                className,
                modality,
                category,
                currentCount,
                checkpointCount,
                growthPct: Math.round(growthPct * 10) / 10,
                growthCount,
                isNew: checkpointCount === 0, // Flag for NEW items
                contributingProjects: contributingProjects
                    .filter(p => p.growthCount > 0) // Only projects with positive growth
                    .sort((a, b) => b.growthCount - a.growthCount) // Sort by growth amount
            });
        }
    }

    // Sort by growth percentage descending
    growthMetrics.sort((a, b) => b.growthPct - a.growthPct);

    return growthMetrics;
};
