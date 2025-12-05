import storage from '../storage/fileStorage.js';

/**
 * Data Access Functions for AI Chatbot
 * These functions provide structured access to annotation data for Gemini to call
 */

// ============= PROJECT FUNCTIONS =============

export async function getProjectsList() {
    const persistentDB = await storage.loadPersistentDB();
    const projectsList = [];

    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];
        if (latest) {
            projectsList.push({
                id: projectId,
                totalImages: latest.metrics?._summary?.total_images || 0,
                annotatedImages: latest.metrics?._summary?.annotated_images || 0,
                annotationProgress: latest.metrics?._summary?.total_images > 0
                    ? ((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100).toFixed(1) + '%'
                    : '0%'
            });
        }
    }

    return projectsList;
}

export async function getProjectDetails(projectId) {
    const persistentDB = await storage.loadPersistentDB();
    const projectData = persistentDB[projectId];

    if (!projectData) return { error: `Project ${projectId} not found` };

    const latest = projectData.history?.[projectData.history.length - 1];
    if (!latest) return { error: `No data for project ${projectId}` };

    return {
        id: projectId,
        totalImages: latest.metrics?._summary?.total_images || 0,
        annotatedImages: latest.metrics?._summary?.annotated_images || 0,
        unannotatedImages: latest.metrics?._summary?.unannotated_images || 0,
        annotationProgress: latest.metrics?._summary?.total_images > 0
            ? ((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100).toFixed(1) + '%'
            : '0%',
        lastUpdated: latest.timestamp,
        classDistribution: latest.metrics ? Object.keys(latest.metrics)
            .filter(k => k !== '_summary')
            .map(className => ({
                class: className,
                imageCount: latest.metrics[className]?.image_count || 0,
                annotationCount: latest.metrics[className]?.annotation_count || 0
            })) : []
    };
}

export async function getProjectHistory(projectId, days = 7) {
    const persistentDB = await storage.loadPersistentDB();
    const projectData = persistentDB[projectId];

    if (!projectData?.history) return { error: `No history for project ${projectId}` };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentHistory = projectData.history
        .filter(entry => new Date(entry.timestamp) >= cutoffDate)
        .map(entry => ({
            timestamp: entry.timestamp,
            annotatedImages: entry.metrics?._summary?.annotated_images || 0,
            totalImages: entry.metrics?._summary?.total_images || 0
        }));

    return {
        projectId,
        days,
        entries: recentHistory,
        currentAnnotated: recentHistory[recentHistory.length - 1]?.annotatedImages || 0,
        startAnnotated: recentHistory[0]?.annotatedImages || 0,
        growth: (recentHistory[recentHistory.length - 1]?.annotatedImages || 0) - (recentHistory[0]?.annotatedImages || 0)
    };
}

export async function getProjectStatistics(projectId) {
    const persistentDB = await storage.loadPersistentDB();
    const projectData = persistentDB[projectId];

    if (!projectData) return { error: `Project ${projectId} not found` };

    const history = projectData.history || [];
    const latest = history[history.length - 1];
    const weekAgo = history.find(h => {
        const date = new Date(h.timestamp);
        const weekAgoDate = new Date();
        weekAgoDate.setDate(weekAgoDate.getDate() - 7);
        return date <= weekAgoDate;
    });

    const currentAnnotated = latest?.metrics?._summary?.annotated_images || 0;
    const weekAgoAnnotated = weekAgo?.metrics?._summary?.annotated_images || 0;
    const weeklyGrowth = currentAnnotated - weekAgoAnnotated;
    const weeklyGrowthRate = weekAgoAnnotated > 0
        ? ((weeklyGrowth / weekAgoAnnotated) * 100).toFixed(1) + '%'
        : 'N/A';

    return {
        projectId,
        currentAnnotated,
        totalImages: latest?.metrics?._summary?.total_images || 0,
        completionRate: latest?.metrics?._summary?.total_images > 0
            ? ((currentAnnotated / latest.metrics._summary.total_images) * 100).toFixed(1) + '%'
            : '0%',
        weeklyGrowth,
        weeklyGrowthRate,
        averagePerDay: (weeklyGrowth / 7).toFixed(1)
    };
}

// ============= CLASS/CATEGORY FUNCTIONS =============

export async function getClassMetrics(className, projectId = null) {
    if (projectId) {
        const persistentDB = await storage.loadPersistentDB();
        const projectData = persistentDB[projectId];
        const latest = projectData?.history?.[projectData.history.length - 1];
        const classData = latest?.metrics?.[className.toLowerCase()];

        if (!classData) return { error: `Class ${className} not found in project ${projectId}` };

        return {
            class: className,
            projectId,
            imageCount: classData.image_count || 0,
            annotationCount: classData.annotation_count || 0
        };
    }

    // Aggregate across all projects
    const persistentDB = await storage.loadPersistentDB();
    let totalImages = 0;
    let totalAnnotations = 0;

    for (const projectData of Object.values(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];
        const classData = latest?.metrics?.[className.toLowerCase()];

        if (classData) {
            totalImages += classData.image_count || 0;
            totalAnnotations += classData.annotation_count || 0;
        }
    }

    return {
        class: className,
        totalImages,
        totalAnnotations,
        acrossAllProjects: true
    };
}

export async function getCategoryMetrics(category) {
    const classPivotDB = await storage.loadClassPivotDB();
    const categoryData = classPivotDB[category];

    if (!categoryData) return { error: `Category ${category} not found` };

    const modalities = ['OPG', 'Bitewing', 'IOPA'];
    const breakdown = {};

    modalities.forEach(modality => {
        const data = categoryData[modality];
        if (data) {
            breakdown[modality] = {
                totalImages: data.total_images || 0,
                annotatedImages: data.annotated_images || 0
            };
        }
    });

    return {
        category,
        breakdown,
        total: Object.values(breakdown).reduce((sum, m) => sum + m.totalImages, 0)
    };
}

export async function getModalityBreakdown(category = null) {
    if (category) {
        return await getCategoryMetrics(category);
    }

    // Get breakdown across all categories
    const classPivotDB = await storage.loadClassPivotDB();
    const modalityTotals = { OPG: 0, Bitewing: 0, IOPA: 0 };

    for (const catData of Object.values(classPivotDB)) {
        ['OPG', 'Bitewing', 'IOPA'].forEach(modality => {
            if (catData[modality]) {
                modalityTotals[modality] += catData[modality].total_images || 0;
            }
        });
    }

    return {
        acrossAllCategories: true,
        breakdown: modalityTotals
    };
}

// ============= CHECKPOINT FUNCTIONS =============

export async function getCheckpoints(type = 'all', id = null) {
    const checkpointsData = await storage.loadCheckpoints();
    const checkpointsList = [];

    // Convert checkpoints object structure to array
    if (type === 'all' || type === 'project') {
        for (const [projectId, checkpoint] of Object.entries(checkpointsData.projects || {})) {
            if (!id || id === projectId) {
                checkpointsList.push({
                    type: 'project',
                    id: projectId,
                    timestamp: checkpoint.timestamp,
                    note: checkpoint.note,
                    metrics: checkpoint.metrics
                });
            }
        }
    }

    if (type === 'all' || type === 'category') {
        for (const [categoryName, checkpoint] of Object.entries(checkpointsData.categories || {})) {
            if (!id || id === categoryName) {
                checkpointsList.push({
                    type: 'category',
                    id: categoryName,
                    timestamp: checkpoint.timestamp,
                    note: checkpoint.note,
                    metrics: checkpoint.metrics
                });
            }
        }
    }

    if (type === 'all' || type === 'class') {
        for (const [className, checkpoint] of Object.entries(checkpointsData.classes || {})) {
            if (!id || id === className) {
                checkpointsList.push({
                    type: 'class',
                    id: className,
                    timestamp: checkpoint.timestamp,
                    note: checkpoint.note,
                    metrics: checkpoint.metrics
                });
            }
        }
    }

    return checkpointsList;
}

export async function getGrowthSinceCheckpoint(projectId) {
    const checkpointsData = await storage.loadCheckpoints();
    const projectCheckpoint = checkpointsData.projects?.[projectId];

    if (!projectCheckpoint) {
        return { error: `No checkpoint found for project ${projectId}` };
    }

    const persistentDB = await storage.loadPersistentDB();
    const projectData = persistentDB[projectId];
    const latest = projectData?.history?.[projectData.history.length - 1];

    const checkpointAnnotated = projectCheckpoint.metrics?._summary?.annotated_images || 0;
    const currentAnnotated = latest?.metrics?._summary?.annotated_images || 0;

    return {
        projectId,
        checkpointDate: projectCheckpoint.timestamp,
        checkpointAnnotated,
        currentAnnotated,
        growth: currentAnnotated - checkpointAnnotated,
        growthRate: checkpointAnnotated > 0
            ? (((currentAnnotated - checkpointAnnotated) / checkpointAnnotated) * 100).toFixed(1) + '%'
            : 'N/A'
    };
}

// ============= ANALYTICS FUNCTIONS =============

export async function getTopPerformingProjects(n = 5, metric = 'annotations') {
    const persistentDB = await storage.loadPersistentDB();
    const projectStats = [];

    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];

        if (latest) {
            projectStats.push({
                id: projectId,
                annotatedImages: latest.metrics?._summary?.annotated_images || 0,
                totalImages: latest.metrics?._summary?.total_images || 0,
                completionRate: latest.metrics?._summary?.total_images > 0
                    ? ((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100).toFixed(1)
                    : 0
            });
        }
    }

    const sortKey = metric === 'completion' ? 'completionRate' : 'annotatedImages';
    projectStats.sort((a, b) => parseFloat(b[sortKey]) - parseFloat(a[sortKey]));

    return projectStats.slice(0, n);
}

export async function getAnnotationTrends(days = 30) {
    const persistentDB = await storage.loadPersistentDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const dailyTotals = {};

    for (const projectData of Object.values(persistentDB)) {
        const history = projectData.history || [];

        history.forEach(entry => {
            const date = new Date(entry.timestamp).toISOString().split('T')[0];
            if (new Date(entry.timestamp) >= cutoffDate) {
                if (!dailyTotals[date]) {
                    dailyTotals[date] = 0;
                }
                dailyTotals[date] += entry.metrics?._summary?.annotated_images || 0;
            }
        });
    }

    return {
        days,
        trend: Object.entries(dailyTotals)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, annotated: count }))
    };
}

export async function getKaggleVsLabelStudio() {
    const persistentDB = await storage.loadPersistentDB();
    const kaggleData = await storage.loadKaggleData();

    let kaggleTotal = 0;
    Object.values(kaggleData).forEach(category => {
        Object.values(category).forEach(xrayType => {
            Object.values(xrayType).forEach(classData => {
                if (typeof classData === 'object' && classData.count) {
                    kaggleTotal += classData.count;
                }
            });
        });
    });

    let lsTotal = 0;
    for (const projectData of Object.values(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];
        lsTotal += latest?.metrics?._summary?.annotated_images || 0;
    }

    return {
        kaggle: kaggleTotal,
        labelStudio: lsTotal,
        total: kaggleTotal + lsTotal,
        kagglePercentage: ((kaggleTotal / (kaggleTotal + lsTotal)) * 100).toFixed(1) + '%',
        labelStudioPercentage: ((lsTotal / (kaggleTotal + lsTotal)) * 100).toFixed(1) + '%'
    };
}

// ============= DATE RANGE FUNCTIONS =============

export async function getAnnotationsByDateRange(startDate, endDate) {
    const persistentDB = await storage.loadPersistentDB();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const results = [];

    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const history = projectData.history || [];

        const inRange = history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate <= end;
        });

        if (inRange.length > 0) {
            const first = inRange[0];
            const last = inRange[inRange.length - 1];

            results.push({
                projectId,
                startAnnotated: first.metrics?._summary?.annotated_images || 0,
                endAnnotated: last.metrics?._summary?.annotated_images || 0,
                growth: (last.metrics?._summary?.annotated_images | 0) - (first.metrics?._summary?.annotated_images || 0)
            });
        }
    }

    return {
        startDate: startDate,
        endDate: endDate,
        projects: results,
        totalGrowth: results.reduce((sum, p) => sum + p.growth, 0)
    };
}

export async function getTodayAnnotations() {
    const today = new Date().toISOString().split('T')[0];
    return await getAnnotationsByDateRange(today, today);
}

export async function getYesterdayAnnotations() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return await getAnnotationsByDateRange(yesterdayStr, yesterdayStr);
}

export async function getThisWeekAnnotations() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today

        .getDate() - today.getDay());

    return await getAnnotationsByDateRange(
        weekStart.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    );
}

export async function getThisMonthAnnotations() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return await getAnnotationsByDateRange(
        monthStart.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    );
}

// ============= SUMMARY FUNCTIONS =============

export async function getOverallSummary() {
    const persistentDB = await storage.loadPersistentDB();
    let totalImages = 0;
    let totalAnnotated = 0;

    for (const projectData of Object.values(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];

        totalImages += latest?.metrics?._summary?.total_images || 0;
        totalAnnotated += latest?.metrics?._summary?.annotated_images || 0;
    }

    return {
        totalProjects: Object.keys(persistentDB).length,
        totalImages,
        totalAnnotated,
        totalUnannotated: totalImages - totalAnnotated,
        overallProgress: totalImages > 0 ? ((totalAnnotated / totalImages) * 100).toFixed(1) + '%' : '0%'
    };
}

export async function searchProjects(query) {
    const projects = await getProjectsList();
    const lowerQuery = query.toLowerCase();

    return projects.filter(p => p.id.toString().includes(lowerQuery));
}
