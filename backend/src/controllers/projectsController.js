import labelStudioService from '../services/labelStudio.js';
import { extractClassMetrics, addMetricsToHistory, getProjectHistory, addBulkMetricsToHistory } from '../services/metricsExtractor.js';
import { checkProjectTrainingReadiness, addNotification } from '../services/notificationService.js';
import { refreshAllCategories } from '../services/categoryAggregator.js';
import storage from '../storage/fileStorage.js';
import { initializeModalities, getProjectModality } from '../services/modalityService.js';

/**
 * Projects Controller
 * Handles project-related API endpoints
 */

// In-memory progress tracking for refresh operations
let refreshProgress = {
    inProgress: false,
    current: 0,
    total: 0,
    currentProjectTitle: '',
    completed: 0,
    failed: 0
};

// Reset progress state
const resetProgress = () => {
    refreshProgress = {
        inProgress: false,
        current: 0,
        total: 0,
        currentProjectTitle: '',
        completed: 0,
        failed: 0
    };
};

// Update progress state
const updateProgress = (current, total, projectTitle, completed, failed) => {
    refreshProgress = {
        inProgress: current < total,
        current,
        total,
        currentProjectTitle: projectTitle,
        completed,
        failed
    };
};

// GET /api/projects - Get all projects
export const getAllProjects = async (req, res) => {
    try {
        const projects = await labelStudioService.getAllProjects();

        // Initialize modalities for all projects (auto-detect if needed)
        const modalities = await initializeModalities(projects);

        // Attach latest metrics and modality to each project
        const projectsWithMetrics = await Promise.all(
            projects.map(async (project) => {
                const history = await getProjectHistory(storage, project.id);
                const latestMetrics = history.length > 0 ? history[history.length - 1] : null;
                const modality = modalities[String(project.id)] || 'Others';

                return {
                    ...project,
                    latest_metrics: latestMetrics,
                    has_history: history.length > 0,
                    modality: modality
                };
            })
        );

        res.json(projectsWithMetrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/projects/:id - Get single project with metrics
export const getProject = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const history = await getProjectHistory(storage, projectId);

        res.json({
            project_id: projectId,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/projects/:id/refresh - Refresh project data
export const refreshProject = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const projectTitle = req.body.project_title || `Project ${projectId}`;

        const tasks = await labelStudioService.getProjectTasks(projectId);
        const metrics = extractClassMetrics(tasks);
        await addMetricsToHistory(storage, projectId, metrics);

        // Also update category aggregations
        await refreshAllCategories(storage);

        const notifications = await checkProjectTrainingReadiness(storage, projectId, projectTitle);
        for (const notif of notifications) {
            await addNotification(storage, notif);
        }

        res.json({
            success: true,
            metrics,
            notifications_added: notifications.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/projects/refresh-all - Refresh all projects (with parallel processing)
export const refreshAllProjects = async (req, res) => {
    try {
        // Reset and initialize progress
        resetProgress();

        const projects = await labelStudioService.getAllProjects();
        const BATCH_SIZE = 4; // Process 4 projects at a time
        const results = [];
        const bulkMetrics = {};

        // Set initial progress
        updateProgress(0, projects.length, 'Initializing...', 0, 0);

        console.log(`📊 Refreshing ${projects.length} projects in batches of ${BATCH_SIZE}...`);

        let completedCount = 0;
        let failedCount = 0;

        // Process projects in batches
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
            const batch = projects.slice(i, i + BATCH_SIZE);
            console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(projects.length / BATCH_SIZE)} (${batch.length} projects)...`);

            // Process batch in parallel
            const batchPromises = batch.map(async (project, batchIndex) => {
                const globalIndex = i + batchIndex;

                // Update progress for this project
                updateProgress(
                    globalIndex + 1,
                    projects.length,
                    project.title,
                    completedCount,
                    failedCount
                );

                try {
                    const tasks = await labelStudioService.getProjectTasks(project.id);
                    const metrics = extractClassMetrics(tasks);

                    // Store in bulk metrics
                    bulkMetrics[project.id] = metrics;

                    const notifications = await checkProjectTrainingReadiness(storage, project.id, project.title);
                    for (const notif of notifications) {
                        await addNotification(storage, notif);
                    }

                    completedCount++;

                    return {
                        project_id: project.id,
                        success: true,
                        notifications: notifications.length
                    };
                } catch (error) {
                    console.error(`❌ Error refreshing project ${project.id}:`, error.message);
                    failedCount++;

                    return {
                        project_id: project.id,
                        success: false,
                        error: error.message
                    };
                }
            });

            // Wait for all projects in batch to complete
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed`);
        }

        // Update progress - saving metrics
        updateProgress(projects.length, projects.length, 'Saving metrics...', completedCount, failedCount);

        // Save all metrics in one go
        if (Object.keys(bulkMetrics).length > 0) {
            console.log(`💾 Saving all project metrics... (${Object.keys(bulkMetrics).length} projects)`);
            await addBulkMetricsToHistory(storage, bulkMetrics);
            console.log('✅ Project metrics saved to persistent_metrics.json');
        }

        // Update progress - aggregating categories
        updateProgress(projects.length, projects.length, 'Aggregating categories...', completedCount, failedCount);

        // Aggregate and save category-level metrics
        console.log('\n========================================');
        console.log('📊 Aggregating category metrics...');
        console.log('========================================\n');
        try {
            await refreshAllCategories(storage);
            console.log('\n========================================');
            console.log('✅ Category metrics updated successfully');
            console.log('========================================\n');
        } catch (error) {
            console.error('\n========================================');
            console.error('❌ ERROR: Category aggregation failed:', error);
            console.error('========================================\n');
        }

        // Reset progress - done
        resetProgress();

        res.json({
            success: true,
            results,
            total_projects: projects.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
    } catch (error) {
        console.error('❌ Error in refreshAllProjects:', error);
        resetProgress();
        res.status(500).json({ error: error.message });
    }
};

// GET /api/projects/refresh-progress - Get current refresh progress
export const getRefreshProgress = async (req, res) => {
    res.json(refreshProgress);
};
