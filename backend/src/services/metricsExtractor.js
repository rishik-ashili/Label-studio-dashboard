import { normalizeClassName } from '../utils/classNormalizer.js';

/**
 * Extract class-wise metrics from tasks
 * Matches Python: extract_class_metrics()
 */
export const extractClassMetrics = (tasks) => {
    const classMetrics = new Map();

    let totalImages = tasks.length;
    let annotatedImages = 0;

    for (const task of tasks) {
        const taskId = task.id;
        const annotations = task.annotations || [];

        if (annotations.length === 0) {
            continue;
        }

        annotatedImages++;
        const classesInImage = new Set();

        for (const annotation of annotations) {
            const result = annotation.result || [];

            for (const item of result) {
                let labels = [];

                // Check different annotation types
                if (item.type === 'rectanglelabels' ||
                    item.type === 'polygonlabels' ||
                    item.type === 'labels' ||
                    item.type === 'brushlabels') {

                    const value = item.value || {};
                    labels = value.rectanglelabels ||
                        value.polygonlabels ||
                        value.brushlabels ||
                        value.labels ||
                        [];
                }

                for (const label of labels) {
                    const normalizedLabel = normalizeClassName(label);

                    // Initialize if not exists
                    if (!classMetrics.has(normalizedLabel)) {
                        classMetrics.set(normalizedLabel, {
                            image_count: 0,
                            annotation_count: 0,
                            images: new Set()
                        });
                    }

                    const metrics = classMetrics.get(normalizedLabel);
                    metrics.annotation_count++;
                    classesInImage.add(normalizedLabel);
                }
            }
        }

        // Add image to each class it appears in
        for (const className of classesInImage) {
            const metrics = classMetrics.get(className);
            metrics.images.add(taskId);
        }
    }

    // Convert to final format
    const finalMetrics = {};

    for (const [className, metrics] of classMetrics.entries()) {
        finalMetrics[className] = {
            image_count: metrics.images.size,
            annotation_count: metrics.annotation_count
        };
    }

    // Add summary
    finalMetrics._summary = {
        total_images: totalImages,
        annotated_images: annotatedImages,
        unannotated_images: totalImages - annotatedImages
    };

    return finalMetrics;
};

/**
 * Add metrics to project history
 * Matches Python: add_metrics_to_history()
 */
export const addMetricsToHistory = async (storage, projectId, metrics) => {
    const db = await storage.loadPersistentDB();

    const projectKey = String(projectId);
    if (!db[projectKey]) {
        db[projectKey] = { history: [] };
    }

    const entry = {
        timestamp: new Date().toISOString(),
        metrics
    };

    db[projectKey].history.push(entry);

    // Keep only last 50 entries
    if (db[projectKey].history.length > 50) {
        db[projectKey].history = db[projectKey].history.slice(-50);
    }

    await storage.savePersistentDB(db);
};

/**
 * Add multiple metrics to project history in one go
 * Reduces file I/O for batch operations
 */
export const addBulkMetricsToHistory = async (storage, projectMetricsMap) => {
    const db = await storage.loadPersistentDB();
    let hasChanges = false;

    for (const [projectId, metrics] of Object.entries(projectMetricsMap)) {
        const projectKey = String(projectId);
        if (!db[projectKey]) {
            db[projectKey] = { history: [] };
        }

        const entry = {
            timestamp: new Date().toISOString(),
            metrics
        };

        db[projectKey].history.push(entry);

        // Keep only last 50 entries
        if (db[projectKey].history.length > 50) {
            db[projectKey].history = db[projectKey].history.slice(-50);
        }
        hasChanges = true;
    }

    if (hasChanges) {
        await storage.savePersistentDB(db);
    }
};

/**
 * Get project history
 * Matches Python: get_project_history()
 */
export const getProjectHistory = async (storage, projectId) => {
    const db = await storage.loadPersistentDB();
    const projectKey = String(projectId);
    return db[projectKey]?.history || [];
};
