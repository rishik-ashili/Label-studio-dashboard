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

// ============= CHECKPOINT FUNCTIONS =============

export async function getCheckpointComparison(projectId) {
    try {
        const checkpoints = await storage.loadCheckpoints();
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();

        const checkpoint = checkpoints.projects?.[projectId];
        const currentData = persistentDB[projectId];

        if (!checkpoint) return { error: `No checkpoint found for project ${projectId}` };
        if (!currentData) return { error: `No current data for project ${projectId}` };

        const latest = currentData.history?.[currentData.history.length - 1];
        if (!latest) return { error: `No metrics found for project ${projectId}` };

        const comparison = {
            projectId,
            projectTitle: projectTitles[projectId] || `Project ${projectId}`,
            checkpointDate: checkpoint.timestamp,
            checkpointNote: checkpoint.note || '',
            checkpointAnnotations: checkpoint.metrics?._summary?.annotated_images || 0,
            currentAnnotations: latest.metrics?._summary?.annotated_images || 0,
            growth: (latest.metrics?._summary?.annotated_images || 0) - (checkpoint.metrics?._summary?.annotated_images || 0),
            growthPercentage: checkpoint.metrics?._summary?.annotated_images > 0
                ? (((latest.metrics._summary.annotated_images - checkpoint.metrics._summary.annotated_images) / checkpoint.metrics._summary.annotated_images) * 100).toFixed(1) + '%'
                : 'N/A',
            classDiff: {}
        };

        // Compare each class
        const allClasses = new Set([
            ...Object.keys(checkpoint.metrics || {}),
            ...Object.keys(latest.metrics || {})
        ]);

        allClasses.forEach(className => {
            if (className !== '_summary') {
                const checkpointCount = checkpoint.metrics?.[className]?.annotation_count || 0;
                const currentCount = latest.metrics?.[className]?.annotation_count || 0;
                const diff = currentCount - checkpointCount;

                if (diff !== 0) {
                    comparison.classDiff[className] = {
                        checkpoint: checkpointCount,
                        current: currentCount,
                        growth: diff,
                        growthPct: checkpointCount > 0 ? ((diff / checkpointCount) * 100).toFixed(1) + '%' : 'NEW'
                    };
                }
            }
        });

        return comparison;
    } catch (error) {
        console.error('Error in getCheckpointComparison:', error);
        return { error: error.message };
    }
}

export async function getAllCheckpointGrowth(threshold = 20) {
    try {
        const checkpoints = await storage.loadCheckpoints();
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();

        const growthProjects = [];

        for (const [projectId, checkpoint] of Object.entries(checkpoints.projects || {})) {
            const currentData = persistentDB[projectId];
            const latest = currentData?.history?.[currentData.history.length - 1];

            if (latest) {
                const checkpointCount = checkpoint.metrics?._summary?.annotated_images || 0;
                const currentCount = latest.metrics?._summary?.annotated_images || 0;
                const growth = currentCount - checkpointCount;
                const growthPct = checkpointCount > 0 ? ((growth / checkpointCount) * 100) : 0;

                if (growthPct >= threshold) {
                    growthProjects.push({
                        projectId,
                        projectTitle: projectTitles[projectId] || `Project ${projectId}`,
                        checkpointDate: checkpoint.timestamp,
                        checkpointCount,
                        currentCount,
                        growth,
                        growthPercentage: growthPct.toFixed(1) + '%'
                    });
                }
            }
        }

        growthProjects.sort((a, b) => parseFloat(b.growthPercentage) - parseFloat(a.growthPercentage));

        return {
            threshold: threshold + '%',
            projectsWithGrowth: growthProjects,
            count: growthProjects.length
        };
    } catch (error) {
        console.error('Error in getAllCheckpointGrowth:', error);
        return { error: error.message };
    }
}

export async function getCheckpointDetails() {
    try {
        const checkpoints = await storage.loadCheckpoints();
        const projectTitles = await fetchProjectTitles();

        const details = [];

        for (const [projectId, checkpoint] of Object.entries(checkpoints.projects || {})) {
            details.push({
                projectId,
                projectTitle: projectTitles[projectId] || `Project ${projectId}`,
                checkpointDate: checkpoint.timestamp,
                markedAt: checkpoint.marked_at,
                note: checkpoint.note || '',
                totalImages: checkpoint.metrics?._summary?.total_images || 0,
                annotatedImages: checkpoint.metrics?._summary?.annotated_images || 0,
                classCount: Object.keys(checkpoint.metrics || {}).filter(k => k !== '_summary').length
            });
        }

        details.sort((a, b) => b.checkpointDate.localeCompare(a.checkpointDate));

        return {
            checkpoints: details,
            totalCheckpoints: details.length
        };
    } catch (error) {
        console.error('Error in getCheckpointDetails:', error);
        return { error: error.message };
    }
}

// ============= TIME-SERIES FUNCTIONS =============

export async function getTimeSeriesForClass(className, days = 7) {
    try {
        const timeSeries = await storage.loadTimeSeries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        const classData = [];

        for (const [date, metrics] of Object.entries(timeSeries)) {
            if (date >= cutoff) {
                let totalImages = 0;
                let totalAnnotations = 0;

                // Sum across all modalities for this class
                Object.entries(metrics).forEach(([modalityClass, data]) => {
                    const [cls, mod] = modalityClass.split('-');
                    if (cls.toLowerCase() === className.toLowerCase()) {
                        totalImages += data.images || 0;
                        totalAnnotations += data.annotations || 0;
                    }
                });

                if (totalImages > 0 || totalAnnotations > 0) {
                    classData.push({
                        date,
                        images: totalImages,
                        annotations: totalAnnotations
                    });
                }
            }
        }

        classData.sort((a, b) => a.date.localeCompare(b.date));

        return {
            className,
            days,
            dataPoints: classData,
            latestCount: classData.length > 0 ? classData[classData.length - 1].annotations : 0
        };
    } catch (error) {
        console.error('Error in getTimeSeriesForClass:', error);
        return { error: error.message };
    }
}

export async function getModalityClassTimeSeries(modality, className, days = 7) {
    try {
        const timeSeries = await storage.loadTimeSeries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        const modalityClassKey = `${className}-${modality}`;
        const dataPoints = [];

        for (const [date, metrics] of Object.entries(timeSeries)) {
            if (date >= cutoff && metrics[modalityClassKey]) {
                dataPoints.push({
                    date,
                    images: metrics[modalityClassKey].images || 0,
                    annotations: metrics[modalityClassKey].annotations || 0
                });
            }
        }

        dataPoints.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate deltas
        const withDeltas = dataPoints.map((point, i) => {
            if (i === 0) return { ...point, imagesDelta: 0, annotationsDelta: 0 };
            return {
                ...point,
                imagesDelta: point.images - dataPoints[i - 1].images,
                annotationsDelta: point.annotations - dataPoints[i - 1].annotations
            };
        });

        return {
            modality,
            className,
            modalityClass: modalityClassKey,
            days,
            dataPoints: withDeltas,
            totalGrowth: withDeltas.length > 0
                ? withDeltas[withDeltas.length - 1].annotations - withDeltas[0].annotations
                : 0
        };
    } catch (error) {
        console.error('Error in getModalityClassTimeSeries:', error);
        return { error: error.message };
    }
}

export async function getDailyGrowthTrend(days = 7) {
    try {
        const timeSeries = await storage.loadTimeSeries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        const dailyTotals = {};

        for (const [date, metrics] of Object.entries(timeSeries)) {
            if (date >= cutoff) {
                let dayTotal = 0;
                Object.values(metrics).forEach(data => {
                    dayTotal += data.annotations || 0;
                });
                dailyTotals[date] = dayTotal;
            }
        }

        const sortedDates = Object.keys(dailyTotals).sort();
        const trend = sortedDates.map((date, i) => ({
            date,
            totalAnnotations: dailyTotals[date],
            dailyGrowth: i > 0 ? dailyTotals[date] - dailyTotals[sortedDates[i - 1]] : 0
        }));

        return {
            days,
            trend,
            totalGrowthInPeriod: trend.length > 0
                ? trend[trend.length - 1].totalAnnotations - trend[0].totalAnnotations
                : 0
        };
    } catch (error) {
        console.error('Error in getDailyGrowthTrend:', error);
        return { error: error.message };
    }
}

// ============= MODALITY FUNCTIONS =============

export async function getModalityBreakdown() {
    try {
        const modalities = await storage.loadProjectModalities();
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();

        const breakdown = {
            OPG: { projects: [], count: 0, totalAnnotations: 0 },
            Bitewing: { projects: [], count: 0, totalAnnotations: 0 },
            IOPA: { projects: [], count: 0, totalAnnotations: 0 },
            Others: { projects: [], count: 0, totalAnnotations: 0 }
        };

        for (const [projectId, modality] of Object.entries(modalities)) {
            const projectData = persistentDB[projectId];
            const latest = projectData?.history?.[projectData.history.length - 1];
            const annotationCount = latest?.metrics?._summary?.annotated_images || 0;

            const mod = modality || 'Others';
            breakdown[mod].projects.push({
                id: projectId,
                title: projectTitles[projectId] || `Project ${projectId}`,
                annotations: annotationCount
            });
            breakdown[mod].count++;
            breakdown[mod].totalAnnotations += annotationCount;
        }

        return breakdown;
    } catch (error) {
        console.error('Error in getModalityBreakdown:', error);
        return { error: error.message };
    }
}

export async function getModalityClassStats(modality) {
    try {
        const modalities = await storage.loadProjectModalities();
        const persistentDB = await storage.loadPersistentDB();

        const classStats = {};

        for (const [projectId, projectModality] of Object.entries(modalities)) {
            if (projectModality === modality) {
                const projectData = persistentDB[projectId];
                const latest = projectData?.history?.[projectData.history.length - 1];

                if (latest?.metrics) {
                    Object.entries(latest.metrics).forEach(([className, data]) => {
                        if (className !== '_summary') {
                            if (!classStats[className]) {
                                classStats[className] = { images: 0, annotations: 0, projectCount: 0 };
                            }
                            classStats[className].images += data.image_count || 0;
                            classStats[className].annotations += data.annotation_count || 0;
                            classStats[className].projectCount++;
                        }
                    });
                }
            }
        }

        const classes = Object.entries(classStats).map(([className, stats]) => ({
            className,
            ...stats
        })).sort((a, b) => b.annotations - a.annotations);

        return {
            modality,
            classes,
            totalClasses: classes.length
        };
    } catch (error) {
        console.error('Error in getModalityClassStats:', error);
        return { error: error.message };
    }
}

export async function compareModalities() {
    try {
        const modalities = await storage.loadProjectModalities();
        const persistentDB = await storage.loadPersistentDB();

        const comparison = {
            OPG: { totalAnnotations: 0, totalImages: 0, projectCount: 0 },
            Bitewing: { totalAnnotations: 0, totalImages: 0, projectCount: 0 },
            IOPA: { totalAnnotations: 0, totalImages: 0, projectCount: 0 },
            Others: { totalAnnotations: 0, totalImages: 0, projectCount: 0 }
        };

        for (const [projectId, modality] of Object.entries(modalities)) {
            const projectData = persistentDB[projectId];
            const latest = projectData?.history?.[projectData.history.length - 1];

            if (latest?.metrics?._summary) {
                const mod = modality || 'Others';
                comparison[mod].totalAnnotations += latest.metrics._summary.annotated_images || 0;
                comparison[mod].totalImages += latest.metrics._summary.total_images || 0;
                comparison[mod].projectCount++;
            }
        }

        const total = Object.values(comparison).reduce((sum, m) => sum + m.totalAnnotations, 0);

        // Add percentages
        Object.keys(comparison).forEach(mod => {
            comparison[mod].percentage = total > 0
                ? ((comparison[mod].totalAnnotations / total) * 100).toFixed(1) + '%'
                : '0%';
        });

        return {
            comparison,
            totalAnnotations: total
        };
    } catch (error) {
        console.error('Error in compareModalities:', error);
        return { error: error.message };
    }
}

// ============= NOTIFICATION FUNCTIONS =============

export async function getTrainingReadyProjects() {
    try {
        const notifications = await storage.loadNotifications();
        const projectTitles = await fetchProjectTitles();

        const readyProjects = notifications.filter(n => n.type === 'TRAINING_READY' && !n.dismissed);

        const enriched = readyProjects.map(n => ({
            projectId: n.projectId,
            projectTitle: projectTitles[n.projectId] || `Project ${n.projectId}`,
            message: n.message,
            threshold: n.threshold,
            currentCount: n.currentAnnotations,
            createdAt: n.createdAt
        }));

        return {
            readyProjects: enriched,
            count: enriched.length
        };
    } catch (error) {
        console.error('Error in getTrainingReadyProjects:', error);
        return { error: error.message };
    }
}

export async function getNotificationsSummary() {
    try {
        const notifications = await storage.loadNotifications();
        const projectTitles = await fetchProjectTitles();

        const grouped = {
            TRAINING_READY: [],
            LOW_PROGRESS: [],
            STALE_PROJECT: [],
            OTHER: []
        };

        notifications.filter(n => !n.dismissed).forEach(n => {
            const enriched = {
                projectId: n.projectId,
                projectTitle: projectTitles[n.projectId] || `Project ${n.projectId}`,
                message: n.message,
                createdAt: n.createdAt,
                priority: n.priority || 'normal'
            };

            const type = n.type || 'OTHER';
            if (grouped[type]) {
                grouped[type].push(enriched);
            } else {
                grouped.OTHER.push(enriched);
            }
        });

        return {
            notifications: grouped,
            totalActive: notifications.filter(n => !n.dismissed).length,
            totalDismissed: notifications.filter(n => n.dismissed).length
        };
    } catch (error) {
        console.error('Error in getNotificationsSummary:', error);
        return { error: error.message };
    }
}

// ============= ADVANCED QUERY FUNCTIONS =============

export async function getGrowthLeaderboard(period = 'week', metric = 'annotations', limit = 10) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();

        const daysMap = { 'day': 1, 'week': 7, 'month': 30 };
        const days = daysMap[period] || 7;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const leaderboard = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const history = projectData.history || [];
            const latest = history[history.length - 1];
            const periodStart = history.find(h => new Date(h.timestamp) <= cutoffDate);

            if (latest && periodStart) {
                const startCount = periodStart.metrics?._summary?.annotated_images || 0;
                const currentCount = latest.metrics?._summary?.annotated_images || 0;
                const growth = currentCount - startCount;
                const growthPct = startCount > 0 ? ((growth / startCount) * 100) : 0;

                leaderboard.push({
                    projectId,
                    projectTitle: projectTitles[projectId] || `Project ${projectId}`,
                    growth,
                    growthPercentage: growthPct.toFixed(1) + '%',
                    currentTotal: currentCount
                });
            }
        }

        const sortKey = metric === 'percentage' ? 'growthPercentage' : 'growth';
        leaderboard.sort((a, b) => {
            const aVal = sortKey === 'growthPercentage' ? parseFloat(a[sortKey]) : a[sortKey];
            const bVal = sortKey === 'growthPercentage' ? parseFloat(b[sortKey]) : b[sortKey];
            return bVal - aVal;
        });

        return {
            period,
            metric,
            leaderboard: leaderboard.slice(0, limit),
            totalProjects: leaderboard.length
        };
    } catch (error) {
        console.error('Error in getGrowthLeaderboard:', error);
        return { error: error.message };
    }
}

export async function getClassGrowthTrend(className, days = 7) {
    try {
        const timeSeries = await storage.loadTimeSeries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        const trend = [];

        for (const [date, metrics] of Object.entries(timeSeries)) {
            if (date >= cutoff) {
                let totalImages = 0;
                let totalAnnotations = 0;

                Object.entries(metrics).forEach(([modalityClass, data]) => {
                    const [cls, mod] = modalityClass.split('-');
                    if (cls.toLowerCase() === className.toLowerCase()) {
                        totalImages += data.images || 0;
                        totalAnnotations += data.annotations || 0;
                    }
                });

                trend.push({
                    date,
                    images: totalImages,
                    annotations: totalAnnotations
                });
            }
        }

        trend.sort((a, b) => a.date.localeCompare(b.date));

        // Add deltas
        const withDeltas = trend.map((point, i) => {
            if (i === 0) return { ...point, dailyGrowth: 0 };
            return {
                ...point,
                dailyGrowth: point.annotations - trend[i - 1].annotations
            };
        });

        return {
            className,
            days,
            trend: withDeltas,
            totalGrowth: withDeltas.length > 1
                ? withDeltas[withDeltas.length - 1].annotations - withDeltas[0].annotations
                : 0
        };
    } catch (error) {
        console.error('Error in getClassGrowthTrend:', error);
        return { error: error.message };
    }
}

export async function searchProjects(criteria) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const projectTitles = await fetchProjectTitles();
        const modalities = await storage.loadProjectModalities();

        let results = [];

        for (const [projectId, projectData] of Object.entries(persistentDB)) {
            const latest = projectData.history?.[projectData.history.length - 1];
            if (!latest) continue;

            const project = {
                id: projectId,
                title: projectTitles[projectId] || `Project ${projectId}`,
                modality: modalities[projectId] || 'Others',
                totalImages: latest.metrics?._summary?.total_images || 0,
                annotatedImages: latest.metrics?._summary?.annotated_images || 0,
                progress: latest.metrics?._summary?.total_images > 0
                    ? ((latest.metrics._summary.annotated_images / latest.metrics._summary.total_images) * 100)
                    : 0
            };

            let matches = true;

            // Apply filters
            if (criteria.modality && project.modality !== criteria.modality) matches = false;
            if (criteria.minProgress !== undefined && project.progress < criteria.minProgress) matches = false;
            if (criteria.maxProgress !== undefined && project.progress > criteria.maxProgress) matches = false;
            if (criteria.minImages !== undefined && project.annotatedImages < criteria.minImages) matches = false;
            if (criteria.hasClass) {
                const hasClass = latest.metrics?.[criteria.hasClass.toLowerCase()];
                if (!hasClass || (hasClass.annotation_count || 0) === 0) matches = false;
            }

            if (matches) {
                results.push({
                    ...project,
                    progress: project.progress.toFixed(1) + '%'
                });
            }
        }

        // Sort if specified
        if (criteria.sortBy) {
            const sortKey = criteria.sortBy === 'progress' ? 'progress' : 'annotatedImages';
            results.sort((a, b) => {
                const aVal = sortKey === 'progress' ? parseFloat(a[sortKey]) : a[sortKey];
                const bVal = sortKey === 'progress' ? parseFloat(b[sortKey]) : b[sortKey];
                return bVal - aVal;
            });
        }

        return {
            criteria,
            projects: results,
            count: results.length
        };
    } catch (error) {
        console.error('Error in searchProjects:', error);
        return { error: error.message };
    }
}

export async function getProjectHealthScore(projectId) {
    try {
        const persistentDB = await storage.loadPersistentDB();
        const checkpoints = await storage.loadCheckpoints();
        const projectTitles = await fetchProjectTitles();
        const modalities = await storage.loadProjectModalities();

        const projectData = persistentDB[projectId];
        if (!projectData) return { error: `Project ${projectId} not found` };

        const latest = projectData.history?.[projectData.history.length - 1];
        if (!latest) return { error: `No data for project ${projectId}` };

        const checkpoint = checkpoints.projects?.[projectId];

        // Calculate various health metrics
        const totalImages = latest.metrics?._summary?.total_images || 0;
        const annotatedImages = latest.metrics?._summary?.annotated_images || 0;
        const progress = totalImages > 0 ? (annotatedImages / totalImages) * 100 : 0;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentHistory = projectData.history.filter(h => new Date(h.timestamp) >= sevenDaysAgo);
        const hasRecentActivity = recentHistory.length > 1;
        const recentGrowth = hasRecentActivity
            ? (recentHistory[recentHistory.length - 1].metrics?._summary?.annotated_images || 0) -
            (recentHistory[0].metrics?._summary?.annotated_images || 0)
            : 0;

        // Checkpoint growth
        const checkpointGrowth = checkpoint
            ? annotatedImages - (checkpoint.metrics?._summary?.annotated_images || 0)
            : 0;

        // Class diversity
        const classCount = Object.keys(latest.metrics).filter(k => k !== '_summary').length;

        // Calculate health score (0-100)
        let healthScore = 0;
        healthScore += Math.min(progress, 100) * 0.4; // 40% weight on completion
        healthScore += hasRecentActivity ? 20 : 0; // 20% for recent activity
        healthScore += Math.min((recentGrowth / 100) * 20, 20); // 20% for recent growth
        healthScore += Math.min((classCount / 10) * 20, 20); // 20% for class diversity

        return {
            projectId,
            projectTitle: projectTitles[projectId] || `Project ${projectId}`,
            modality: modalities[projectId] || 'Others',
            healthScore: Math.round(healthScore),
            healthGrade: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention',
            metrics: {
                completionProgress: progress.toFixed(1) + '%',
                hasRecentActivity,
                recentGrowth,
                checkpointGrowth,
                classCount,
                totalImages,
                annotatedImages
            }
        };
    } catch (error) {
        console.error('Error in getProjectHealthScore:', error);
        return { error: error.message };
    }
}
