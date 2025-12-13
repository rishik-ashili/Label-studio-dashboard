import { calculateIncreasePct } from '../utils/deltaCalculator.js';
import { getProjectHistory } from './metricsExtractor.js';

/**
 * Checkpoint Service
 * Handles checkpoint creation and management
 */

/**
 * Add project checkpoint
 * Matches Python: add_project_checkpoint()
 */
export const addProjectCheckpoint = async (storage, projectId, projectTitle, note = '') => {
    const checkpoints = await storage.loadCheckpoints();
    const history = await getProjectHistory(storage, projectId);

    if (history.length === 0) {
        return false;
    }

    const latest = history[history.length - 1];

    checkpoints.projects[String(projectId)] = {
        project_id: projectId,
        project_title: projectTitle,
        timestamp: latest.timestamp,
        metrics: latest.metrics,
        note,
        marked_at: new Date().toISOString()
    };

    await storage.saveCheckpoints(checkpoints);
    return true;
};

/**
 * Get project checkpoint
 * Matches Python: get_project_checkpoint()
 */
export const getProjectCheckpoint = async (storage, projectId) => {
    const checkpoints = await storage.loadCheckpoints();
    return checkpoints.projects[String(projectId)] || null;
};

/**
 * Add category checkpoint
 */
export const addCategoryCheckpoint = async (storage, category, note = '') => {
    const checkpoints = await storage.loadCheckpoints();
    const db = await storage.loadClassPivotDB();
    const history = db[category]?.history || [];

    if (history.length === 0) {
        return false;
    }

    const latest = history[history.length - 1];

    checkpoints.categories[category] = {
        category,
        timestamp: latest.timestamp,
        metrics: latest.metrics,
        note,
        marked_at: new Date().toISOString()
    };

    await storage.saveCheckpoints(checkpoints);
    return true;
};

/**
 * Get category checkpoint
 */
export const getCategoryCheckpoint = async (storage, category) => {
    const checkpoints = await storage.loadCheckpoints();
    return checkpoints.categories[category] || null;
};

/**
 * Add class checkpoint
 */
export const addClassCheckpoint = async (storage, className, xrayType, note = '') => {
    const checkpoints = await storage.loadCheckpoints();
    const projects = await storage.loadPersistentDB(); // Load project history

    if (!checkpoints.classes) {
        checkpoints.classes = {};
    }

    // Calculate current metrics for this class across all projects of this X-ray type
    // Matches dash.py: add_class_checkpoint logic
    let totalImages = 0;
    let totalAnnotations = 0;

    // We need project titles to check X-ray type. 
    // Since persistentDB doesn't store titles, we might need to fetch projects or rely on what we have.
    // However, dash.py fetches all projects to get titles. 
    // Here we'll use the labelStudio service if possible, or just iterate what we have if we can't.
    // Ideally we should inject labelStudioService, but for now let's assume we can get titles from checkpoints or just iterate all history.
    // Actually, we need to know the X-ray type of each project.

    // Let's try to get project list from labelStudio service
    // But we are in a service that takes 'storage' as arg.
    // We'll rely on the caller to pass correct data or we'll iterate all projects in history 
    // and hopefully we can filter by X-ray type if we had titles.
    // Since we don't have titles in persistentDB, we might need to fetch them.

    // For now, let's implement the aggregation logic assuming we can filter.
    // But wait, we can't filter by X-ray type without project titles.
    // The dash.py logic iterates `self.get_all_projects()`.

    // To fix this properly without circular dependencies or extra calls, 
    // we'll initialize with 0 but we really should calculate it.
    // Given the constraints and the bug report, I'll try to fetch projects if I can import the service.

    // importing labelStudioService here might cause circular dependency if it imports this.
    // labelStudio.js does NOT import checkpointService.

    const { default: labelStudioService } = await import('./labelStudio.js');
    const allProjects = await labelStudioService.getAllProjects();
    const { detectXrayType } = await import('../utils/xrayDetector.js'); // We need this backend utility

    for (const project of allProjects) {
        const title = project.title || '';
        if (detectXrayType(title) !== xrayType) continue;

        const history = projects[String(project.id)]?.history || [];
        if (history.length > 0) {
            const latest = history[history.length - 1];
            const metrics = latest.metrics?.[className];
            if (metrics) {
                totalImages += metrics.image_count || 0;
                totalAnnotations += metrics.annotation_count || 0;
            }
        }
    }

    const checkpointKey = `${className}_${xrayType}`;

    checkpoints.classes[checkpointKey] = {
        class_name: className,
        xray_type: xrayType,
        timestamp: new Date().toISOString(),
        metrics: { images: totalImages, annotations: totalAnnotations },
        note,
        marked_at: new Date().toISOString()
    };

    await storage.saveCheckpoints(checkpoints);
    return true;
};

/**
 * Get class checkpoint
 */
export const getClassCheckpoint = async (storage, className, xrayType) => {
    const checkpoints = await storage.loadCheckpoints();
    const checkpointKey = `${className}_${xrayType}`;
    return checkpoints.classes?.[checkpointKey] || null;
};

/**
 * Update project checkpoint note
 */
export const updateProjectCheckpointNote = async (storage, projectId, note) => {
    const checkpoints = await storage.loadCheckpoints();
    const checkpoint = checkpoints.projects[String(projectId)];

    if (!checkpoint) {
        return false;
    }

    checkpoint.note = note;
    checkpoint.updated_at = new Date().toISOString();

    await storage.saveCheckpoints(checkpoints);
    return true;
};

/**
 * Update category checkpoint note
 */
export const updateCategoryCheckpointNote = async (storage, category, note) => {
    const checkpoints = await storage.loadCheckpoints();
    const checkpoint = checkpoints.categories[category];

    if (!checkpoint) {
        return false;
    }

    checkpoint.note = note;
    checkpoint.updated_at = new Date().toISOString();

    await storage.saveCheckpoints(checkpoints);
    return true;
};

/**
 * Update class checkpoint note
 */
export const updateClassCheckpointNote = async (storage, className, xrayType, note) => {
    const checkpoints = await storage.loadCheckpoints();
    const checkpointKey = `${className}_${xrayType}`;
    const checkpoint = checkpoints.classes?.[checkpointKey];

    if (!checkpoint) {
        return false;
    }

    checkpoint.note = note;
    checkpoint.updated_at = new Date().toISOString();

    await storage.saveCheckpoints(checkpoints);
    return true;
};

