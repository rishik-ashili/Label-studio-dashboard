import storage from '../storage/fileStorage.js';
import axios from 'axios';

/**
 * Data Access Functions for AI Chatbot
 * These functions provide structured access to annotation data for Gemini to call
 */

// Cache for project titles
let projectTitlesCache = null;
let projectTitlesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch project titles from Label Studio API
 */
async function fetchProjectTitles() {
    // Check cache
    if (projectTitlesCache && (Date.now() - projectTitlesCacheTime) < CACHE_DURATION) {
        return projectTitlesCache;
    }

    try {
        const labelStudioUrl = process.env.LABEL_STUDIO_URL || 'http://localhost:8080';
        const apiKey = process.env.LABEL_STUDIO_API_KEY;

        const response = await axios.get(`${labelStudioUrl}/api/projects`, {
            headers: { 'Authorization': `Token ${apiKey}` }
        });

        const titleMap = {};
        response.data.results.forEach(project => {
            titleMap[project.id] = project.title;
        });

        projectTitlesCache = titleMap;
        projectTitlesCacheTime = Date.now();
        return titleMap;
    } catch (error) {
        console.error('Failed to fetch project titles:', error.message);
        return {};
    }
}


// ============= PROJECT FUNCTIONS =============

export async function getProjectsList() {
    const persistentDB = await storage.loadPersistentDB();
    const projectTitles = await fetchProjectTitles();
    const projectsList = [];

    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const latest = projectData.history?.[projectData.history.length - 1];
        if (latest) {
            projectsList.push({
                id: projectId,
                title: projectTitles[projectId] || `Project ${projectId}`,
                totalImages: latest.metrics?._summary?.total_images || 0,
                annotatedImages: latest.metrics?._summary?.annotated_images || 0,
                annotationProgress: latest.metrics?._summary?.total_images > 0
                    ? ((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100).toFixed(1) + '%'
                    : '0%'
            });
        }
    }

    return { projects: projectsList };
}

export async function getProjectDetails(projectId) {
    const persistentDB = await storage.loadPersistentDB();
    const projectData = persistentDB[projectId];
    const projectTitles = await fetchProjectTitles();

    if (!projectData) return { error: `Project ${projectId} not found` };

    const latest = projectData.history?.[projectData.history.length - 1];
    if (!latest) return { error: `No data for project ${projectId}` };

    return {
        id: projectId,
        title: projectTitles[projectId] || `Project ${projectId}`,
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

export async function getTodayAnnotations() {
    const today = new Date().toISOString().split('T')[0];
    const persistentDB = await storage.loadPersistentDB();
    const projectTitles = await fetchProjectTitles();
    let totalGrowth = 0;
    const projects = [];

    for (const [projectId, projectData] of Object.entries(persistentDB)) {
        const history = projectData.history || [];
        const todayEntries = history.filter(entry => entry.timestamp.startsWith(today));

        if (todayEntries.length > 0) {
            const first = todayEntries[0];
            const last = todayEntries[todayEntries.length - 1];
            const growth = (last.metrics?._summary?.annotated_images || 0) - (first.metrics?._summary?.annotated_images || 0);

            if (growth > 0) {
                projects.push({
                    id: projectId,
                    title: projectTitles[projectId] || `Project ${projectId}`,
                    growth
                });
                totalGrowth += growth;
            }
        }
    }

    return {
        date: today,
        totalAnnotations: totalGrowth,
        projects
    };
}

export async function getTopPerformingProjects(n = 5, metric = 'annotations') {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();

        console.log('[getTopPerformingProjects] persistentDB keys:', Object.keys(persistentDB));
        console.log('[getTopPerformingProjects] n:', n, 'metric:', metric);

        const projectStats = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];

            if (latest) {
                const stats = {
                    id: projectId,
                    title: projectTitles[projectId] || `Project ${projectId}`,
                    annotatedImages: latest.metrics?._summary?.annotated_images || 0,
                    totalImages: latest.metrics?._summary?.total_images || 0,
                    completionRate: latest.metrics?._summary?.total_images > 0
                        ? parseFloat(((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100).toFixed(1))
                        : 0
                };
                projectStats.push(stats);
                console.log('[getTopPerformingProjects] Project:', stats.title, 'Annotated:', stats.annotatedImages);
            }
        }

        const sortKey = metric === 'completion' ? 'completionRate' : 'annotatedImages';
        projectStats.sort((a, b) => b[sortKey] - a[sortKey]);

        console.log('[getTopPerformingProjects] Total projects:', projectStats.length);
        console.log('[getTopPerformingProjects] Returning top', n, 'projects');

        return { projects: projectStats.slice(0, n) };
    } catch (error) {
        console.error('Error in getTopPerformingProjects:', error);
        return { error: error.message };
    }
}

export async function getKaggleVsLabelStudio() {
    try {
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
            kagglePercentage: kaggleTotal + lsTotal > 0 ? ((kaggleTotal / (kaggleTotal + lsTotal)) * 100).toFixed(1) + '%' : '0%',
            labelStudioPercentage: kaggleTotal + lsTotal > 0 ? ((lsTotal / (kaggleTotal + lsTotal)) * 100).toFixed(1) + '%' : '0%'
        };
    } catch (error) {
        console.error('Error in getKaggleVsLabelStudio:', error);
        return { error: error.message };
    }
}

// ============= TIME-BASED FUNCTIONS =============

export async function getWeeklyGrowthByProject(weeks = 1) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));

        const projectGrowth = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const history = projectData.history || [];
            const latest = history[history.length - 1];

            // Find entry from N weeks ago
            const weekAgoEntry = history.find(h => new Date(h.timestamp) <= cutoffDate);

            if (latest && weekAgoEntry) {
                const currentAnnotated = latest.metrics?._summary?.annotated_images || 0;
                const weekAgoAnnotated = weekAgoEntry.metrics?._summary?.annotated_images || 0;
                const growth = currentAnnotated - weekAgoAnnotated;

                if (growth > 0) {
                    projectGrowth.push({
                        id: projectId,
                        title: projectTitles[projectId] || `Project ${projectId}`,
                        weeklyGrowth: growth,
                        currentTotal: currentAnnotated,
                        growthRate: weekAgoAnnotated > 0 ? ((growth / weekAgoAnnotated) * 100).toFixed(1) + '%' : 'N/A'
                    });
                }
            }
        }

        // Sort by growth
        projectGrowth.sort((a, b) => b.weeklyGrowth - a.weeklyGrowth);

        return {
            weeks,
            projects: projectGrowth,
            totalGrowth: projectGrowth.reduce((sum, p) => sum + p.weeklyGrowth, 0)
        };
    } catch (error) {
        console.error('Error in getWeeklyGrowthByProject:', error);
        return { error: error.message };
    }
}

export async function getRecentActivityProjects(days = 7) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const activeProjects = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const history = projectData.history || [];
            const recentActivity = history.filter(h => new Date(h.timestamp) >= cutoffDate);

            if (recentActivity.length > 0) {
                const first = recentActivity[0];
                const last = recentActivity[recentActivity.length - 1];
                const growth = (last.metrics?._summary?.annotated_images || 0) - (first.metrics?._summary?.annotated_images || 0);

                if (growth > 0) {
                    activeProjects.push({
                        id: projectId,
                        title: projectTitles[projectId] || `Project ${projectId}`,
                        recentGrowth: growth,
                        totalAnnotated: last.metrics?._summary?.annotated_images || 0,
                        activityCount: recentActivity.length
                    });
                }
            }
        }

        activeProjects.sort((a, b) => b.recentGrowth - a.recentGrowth);

        return {
            days,
            activeProjects,
            totalRecentAnnotations: activeProjects.reduce((sum, p) => sum + p.recentGrowth, 0)
        };
    } catch (error) {
        console.error('Error in getRecentActivityProjects:', error);
        return { error: error.message };
    }
}

export async function getAnnotationVelocity(days = 7) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let totalGrowth = 0;

        for (const projectData of Object.values(persistentDB)) {
            const history = projectData.history || [];
            const recentEntries = history.filter(h => new Date(h.timestamp) >= cutoffDate);

            if (recentEntries.length > 0) {
                const first = recentEntries[0];
                const last = recentEntries[recentEntries.length - 1];
                totalGrowth += (last.metrics?._summary?.annotated_images || 0) - (first.metrics?._summary?.annotated_images || 0);
            }
        }

        const avgPerDay = (totalGrowth / days).toFixed(1);
        const projectedWeek = (parseFloat(avgPerDay) * 7).toFixed(0);
        const projectedMonth = (parseFloat(avgPerDay) * 30).toFixed(0);

        return {
            days,
            totalAnnotations: totalGrowth,
            averagePerDay: avgPerDay,
            projectedWeekly: projectedWeek,
            projectedMonthly: projectedMonth
        };
    } catch (error) {
        console.error('Error in getAnnotationVelocity:', error);
        return { error: error.message };
    }
}

// ============= FILTERING FUNCTIONS =============

export async function getProjectsNeedingAttention(threshold = 50) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const needsAttention = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];

            if (latest) {
                const total = latest.metrics?._summary?.total_images || 0;
                const annotated = latest.metrics?._summary?.annotated_images || 0;
                const progress = total > 0 ? (annotated / total) * 100 : 0;

                if (progress < threshold && total > 0) {
                    needsAttention.push({
                        id: projectId,
                        title: projectTitles[projectId] || `Project ${projectId}`,
                        progress: progress.toFixed(1) + '%',
                        annotated,
                        total,
                        remaining: total - annotated
                    });
                }
            }
        }

        needsAttention.sort((a, b) => parseFloat(a.progress) - parseFloat(b.progress));

        return {
            threshold: threshold + '%',
            projects: needsAttention,
            totalProjectsNeedingAttention: needsAttention.length
        };
    } catch (error) {
        console.error('Error in getProjectsNeedingAttention:', error);
        return { error: error.message };
    }
}

export async function searchProjectsByProgress(minProgress, maxProgress) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const matches = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];

            if (latest) {
                const total = latest.metrics?._summary?.total_images || 0;
                const annotated = latest.metrics?._summary?.annotated_images || 0;
                const progress = total > 0 ? (annotated / total) * 100 : 0;

                if (progress >= minProgress && progress <= maxProgress) {
                    matches.push({
                        id: projectId,
                        title: projectTitles[projectId] || `Project ${projectId}`,
                        progress: progress.toFixed(1) + '%',
                        annotated,
                        total
                    });
                }
            }
        }

        matches.sort((a, b) => parseFloat(b.progress) - parseFloat(a.progress));

        return {
            minProgress: minProgress + '%',
            maxProgress: maxProgress + '%',
            projects: matches,
            count: matches.length
        };
    } catch (error) {
        console.error('Error in searchProjectsByProgress:', error);
        return { error: error.message };
    }
}

// ============= CLASS-SPECIFIC FUNCTIONS =============

export async function getProjectsByClass(className) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const projects = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];
            const classData = latest?.metrics?.[className.toLowerCase()];

            if (classData && (classData.image_count > 0 || classData.annotation_count > 0)) {
                projects.push({
                    id: projectId,
                    title: projectTitles[projectId] || `Project ${projectId}`,
                    imageCount: classData.image_count || 0,
                    annotationCount: classData.annotation_count || 0
                });
            }
        }

        projects.sort((a, b) => b.annotationCount - a.annotationCount);

        return {
            className,
            projects,
            totalImages: projects.reduce((sum, p) => sum + p.imageCount, 0),
            totalAnnotations: projects.reduce((sum, p) => sum + p.annotationCount, 0)
        };
    } catch (error) {
        console.error('Error in getProjectsByClass:', error);
        return { error: error.message };
    }
}

export async function getClassDistributionSummary() {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const classStats = {};

        for (const projectData of Object.values(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];

            if (latest?.metrics) {
                Object.entries(latest.metrics).forEach(([className, data]) => {
                    if (className !== '_summary') {
                        if (!classStats[className]) {
                            classStats[className] = { imageCount: 0, annotationCount: 0, projectCount: 0 };
                        }
                        classStats[className].imageCount += data.image_count || 0;
                        classStats[className].annotationCount += data.annotation_count || 0;
                        classStats[className].projectCount += 1;
                    }
                });
            }
        }

        const distribution = Object.entries(classStats).map(([className, stats]) => ({
            className,
            ...stats
        })).sort((a, b) => b.annotationCount - a.annotationCount);

        return {
            classes: distribution,
            totalClasses: distribution.length
        };
    } catch (error) {
        console.error('Error in getClassDistributionSummary:', error);
        return { error: error.message };
    }
}
