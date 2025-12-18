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
 * Now prioritizes class checkpoints over project checkpoints
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

        // Get project checkpoint (fallback if no class checkpoint)
        const projectCheckpoint = checkpoints.projects?.[projectId];
        const projectCheckpointMetrics = projectCheckpoint?.metrics || {};

        // Process each class
        for (const [className, classData] of Object.entries(latestMetrics)) {
            if (className === '_summary') continue;

            const currentCount = classData.image_count || 0;

            // PRIORITY 1: Check for class-specific checkpoint
            const classCheckpointKey = `${className}_${modality}`;
            const classCheckpoint = checkpoints.classes?.[classCheckpointKey];

            let checkpointCount = 0;
            let checkpointType = 'none';
            let checkpointDate = null;
            let checkpointSource = null;

            if (classCheckpoint) {
                // Use class checkpoint
                checkpointCount = classCheckpoint.metrics?.images || 0;
                checkpointType = 'class';
                checkpointDate = classCheckpoint.marked_at;
                checkpointSource = `${className}-${modality}`;
            } else if (projectCheckpointMetrics[className]) {
                // Fall back to project checkpoint for this class
                checkpointCount = projectCheckpointMetrics[className]?.image_count || 0;
                checkpointType = 'project';
                checkpointDate = projectCheckpoint.marked_at;
                checkpointSource = `Project ${projectId}`;
            }

            // Create modality-class key
            const key = `${className}-${modality}`;

            if (!modalityClassData[key]) {
                modalityClassData[key] = {
                    className,
                    modality,
                    currentCount: 0,
                    checkpointCount: 0,
                    checkpointType: 'none',
                    checkpointDate: null,
                    checkpointSource: null,
                    contributingProjects: []
                };
            }

            modalityClassData[key].currentCount += currentCount;
            modalityClassData[key].checkpointCount += checkpointCount;

            // Update checkpoint metadata (prioritize class checkpoint)
            if (checkpointType === 'class') {
                modalityClassData[key].checkpointType = 'class';
                modalityClassData[key].checkpointDate = checkpointDate;
                modalityClassData[key].checkpointSource = checkpointSource;
            } else if (checkpointType === 'project' && modalityClassData[key].checkpointType === 'none') {
                modalityClassData[key].checkpointType = 'project';
                modalityClassData[key].checkpointDate = checkpointDate;
                modalityClassData[key].checkpointSource = checkpointSource;
            }

            // Track project contribution
            if (currentCount > 0 || checkpointCount > 0) {
                const projectGrowthPct = checkpointCount > 0
                    ? ((currentCount - checkpointCount) / checkpointCount) * 100
                    : (currentCount > 0 ? 100 : 0);

                modalityClassData[key].contributingProjects.push({
                    projectId: parseInt(projectId),
                    projectTitle: `Project ${projectId}`,
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
        const { className, modality, currentCount, checkpointCount, contributingProjects,
            checkpointType, checkpointDate, checkpointSource } = data;

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
                isNew: checkpointCount === 0,
                checkpointType,  // 'class', 'project', or 'none'
                checkpointDate,  // ISO date string
                checkpointSource, // e.g., "pulp-IOPA" or "Project 5"
                contributingProjects: contributingProjects
                    .filter(p => p.growthCount > 0)
                    .sort((a, b) => b.growthCount - a.growthCount)
            });
        }
    }

    // Sort by growth percentage descending
    growthMetrics.sort((a, b) => b.growthPct - a.growthPct);

    return growthMetrics;
};

