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
export const calculateModalityClassGrowth = async (threshold = 20, injectedDB = null, injectedCheckpoints = null, injectedModalities = null) => {
    const persistentDB = injectedDB || await storage.loadPersistentDB();
    const checkpoints = injectedCheckpoints || await storage.loadCheckpoints();
    const modalities = injectedModalities || await getAllModalities();

    const growthMetrics = [];

    // Group by modality-class combination
    // Use a Map or Object to aggregate data first
    const modalityClassData = {};

    // Step 1: Aggregate Current Counts and Project Checkpoint Counts
    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const history = projectData.history || [];
        if (history.length === 0) continue;

        const latestMetrics = history[history.length - 1].metrics;
        const modality = modalities[projectId] || 'Others';

        // Get project checkpoint (fallback)
        const projectCheckpoint = checkpoints.projects?.[projectId];
        const projectCheckpointMetrics = projectCheckpoint?.metrics || {};

        for (const [className, classData] of Object.entries(latestMetrics)) {
            if (className === '_summary') continue;

            const currentCount = classData.image_count || 0;
            const projectCheckpointCount = projectCheckpointMetrics[className]?.image_count || 0;

            // Create a normalized key for aggregation
            const key = `${className}-${modality}`;

            if (!modalityClassData[key]) {
                modalityClassData[key] = {
                    className,
                    modality,
                    currentCount: 0,
                    projectCheckpointCount: 0,
                    contributingProjects: [],
                    // We will resolve the final checkpoint later
                };
            }

            // Aggregate
            modalityClassData[key].currentCount += currentCount;
            modalityClassData[key].projectCheckpointCount += projectCheckpointCount;

            // Track detailed contribution (using project specific math)
            if (currentCount > 0 || projectCheckpointCount > 0) {
                const projectGrowthPct = projectCheckpointCount > 0
                    ? ((currentCount - projectCheckpointCount) / projectCheckpointCount) * 100
                    : (currentCount > 0 ? 100 : 0);

                modalityClassData[key].contributingProjects.push({
                    projectId: parseInt(projectId),
                    projectTitle: `Project ${projectId}`,
                    currentCount,
                    checkpointCount: projectCheckpointCount,
                    growthPct: Math.round(projectGrowthPct * 10) / 10,
                    growthCount: currentCount - projectCheckpointCount
                });
            }
        }
    }

    // Step 2: Resolve Final Checkpoints (Class vs Project) and Calculate Growth
    for (const [key, data] of Object.entries(modalityClassData)) {
        const { className, modality, currentCount, projectCheckpointCount, contributingProjects } = data;

        // Skip if no current data
        if (currentCount === 0) continue;

        let finalCheckpointCount = projectCheckpointCount; // Default to sum of project checkpoints
        let checkpointType = 'project';
        let checkpointDate = null;
        let checkpointSource = 'Aggregated Projects';

        // Try to find a specific Class Checkpoint
        // Look for keys like "Pulp_IOPA" or "pulp_IOPA" case-insensitively
        const targetClassKey = `${className}_${modality}`.toLowerCase();

        let foundClassCheckpoint = null;
        if (checkpoints.classes) {
            for (const [cpKey, cpData] of Object.entries(checkpoints.classes)) {
                if (cpKey.toLowerCase() === targetClassKey) {
                    foundClassCheckpoint = cpData;
                    break;
                }
            }
        }

        if (foundClassCheckpoint) {
            finalCheckpointCount = foundClassCheckpoint.metrics?.images || 0;
            checkpointType = 'class';
            checkpointDate = foundClassCheckpoint.marked_at;
            checkpointSource = `${foundClassCheckpoint.class_name} (${foundClassCheckpoint.xray_type})`;
        } else {
            // Determine simpler fallback status
            if (finalCheckpointCount === 0 && projectCheckpointCount === 0) {
                checkpointType = 'none';
                checkpointSource = null;
            }
        }

        // Calculate Growth
        let growthPct;
        let growthCount = currentCount - finalCheckpointCount;

        if (finalCheckpointCount === 0) {
            growthPct = 100;
        } else {
            growthPct = ((currentCount - finalCheckpointCount) / finalCheckpointCount) * 100;
        }

        if (growthPct >= threshold) {
            // Find category
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
                checkpointCount: finalCheckpointCount,
                growthPct: Math.round(growthPct * 10) / 10,
                growthCount,
                isNew: finalCheckpointCount === 0,
                checkpointType,
                checkpointDate,
                checkpointSource,
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

