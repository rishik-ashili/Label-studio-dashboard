import storage from '../storage/fileStorage.js';
import { getAllModalities } from './modalityService.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';
import labelStudioService from './labelStudio.js';
import { extractClassMetrics } from './metricsExtractor.js';

/**
 * Growth Service
 * Calculates modality-class wise growth metrics using LIVE data from Label Studio
 */

/**
 * Calculate growth for all modality-class combinations
 * Returns metrics that exceed the given threshold
 * Uses LIVE data from Label Studio API vs checkpoint snapshots
 */
export const calculateModalityClassGrowth = async (threshold = 20) => {
    // Get LIVE projects from Label Studio
    const projects = await labelStudioService.getAllProjects();
    const checkpoints = await storage.loadCheckpoints();
    const modalities = await getAllModalities();

    const growthMetrics = [];

    // Group by modality-class combination
    const modalityClassData = {};

    // Process each project with LIVE data
    for (const project of projects) {
        try {
            // Fetch LIVE tasks from Label Studio
            const tasks = await labelStudioService.getProjectTasks(project.id);
            const latestMetrics = extractClassMetrics(tasks);
            const modality = modalities[String(project.id)] || 'Others';

            // Get checkpoint for this project (may not exist)
            const checkpointData = checkpoints.projects?.[project.id];
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
                        projectId: parseInt(project.id),
                        projectTitle: project.title,
                        currentCount,
                        checkpointCount,
                        growthPct: Math.round(projectGrowthPct * 10) / 10,
                        growthCount: currentCount - checkpointCount
                    });
                }
            }
        } catch (error) {
            console.error(`Error processing project ${project.id} for growth calculation:`, error.message);
            // Continue with other projects
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
