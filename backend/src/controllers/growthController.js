import { calculateModalityClassGrowth } from '../services/growthService.js';
import labelStudioService from '../services/labelStudio.js';

/**
 * Growth Controller
 * Handles growth tracking API endpoints
 */

// GET /api/growth - Get modality-class growth metrics
export const getGrowthMetrics = async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold) || 20;

        // Calculate growth metrics
        const metrics = await calculateModalityClassGrowth(threshold);

        // Enrich with project titles
        const projects = await labelStudioService.getAllProjects();
        const projectTitlesMap = {};
        projects.forEach(p => {
            projectTitlesMap[p.id] = p.title;
        });

        // Add project titles to contributing projects
        metrics.forEach(metric => {
            metric.contributingProjects = metric.contributingProjects.map(cp => ({
                ...cp,
                projectTitle: projectTitlesMap[cp.projectId] || `Project ${cp.projectId}`
            }));
        });

        res.json({
            threshold,
            metrics,
            count: metrics.length
        });
    } catch (error) {
        console.error('Error calculating growth metrics:', error);
        res.status(500).json({ error: error.message });
    }
};
