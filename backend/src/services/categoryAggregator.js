import labelStudioService from './labelStudio.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';
import { detectXrayType } from '../utils/xrayDetector.js';

/**
 * Aggregate class metrics by X-ray type across all projects
 * Matches dash.py: aggregate_class_metrics_by_xray()
 */
export const aggregateClassMetricsByXray = async (storage) => {
    // Get all projects with their latest metrics
    const projects = await labelStudioService.getAllProjects();
    const aggregated = {};

    for (const project of projects) {
        const projectId = project.id;
        const projectTitle = project.title || `Project ${projectId}`;
        const xrayType = detectXrayType(projectTitle);

        // Load project history
        const db = await storage.loadPersistentDB();
        const history = db[String(projectId)]?.history || [];

        if (history.length === 0) continue;

        const latestMetrics = history[history.length - 1].metrics;

        // Aggregate by class
        for (const [className, metrics] of Object.entries(latestMetrics)) {
            if (className === '_summary') continue;

            if (!aggregated[className]) {
                aggregated[className] = {};
            }

            if (!aggregated[className][xrayType]) {
                aggregated[className][xrayType] = {
                    images: 0,
                    annotations: 0
                };
            }

            aggregated[className][xrayType].images += metrics.image_count || 0;
            aggregated[className][xrayType].annotations += metrics.annotation_count || 0;
        }
    }

    return aggregated;
};

/**
 * Add category metrics to history
 * Matches dash.py: add_class_pivot_to_history()
 */
export const addCategoryToHistory = async (storage, category, metrics) => {
    console.log(`📝 [addCategoryToHistory] Adding history for ${category}...`);
    const db = await storage.loadClassPivotDB();

    if (!db[category]) {
        console.log(`🆕 [addCategoryToHistory] Creating new category: ${category}`);
        db[category] = { history: [] };
    } else {
        console.log(`📚 [addCategoryToHistory] ${category} has ${db[category].history.length} existing entries`);
    }

    const entry = {
        timestamp: new Date().toISOString(),
        metrics
    };

    db[category].history.push(entry);
    console.log(`➕ [addCategoryToHistory] Added entry. New history length: ${db[category].history.length}`);

    // Keep only last 50 entries
    if (db[category].history.length > 50) {
        db[category].history = db[category].history.slice(-50);
        console.log(`✂️  [addCategoryToHistory] Trimmed to last 50 entries`);
    }

    await storage.saveClassPivotDB(db);
    console.log(`✅ [addCategoryToHistory] Saved ${category} to database`);
};

/**
 * Refresh and save all category metrics
 */
export const refreshAllCategories = async (storage) => {
    try {
        console.log('🔍 [CategoryAggregator] Starting refreshAllCategories...');

        // Get aggregated metrics
        console.log('📊 [CategoryAggregator] Calling aggregateClassMetricsByXray...');
        const allMetrics = await aggregateClassMetricsByXray(storage);
        console.log(`✅ [CategoryAggregator] Aggregated ${Object.keys(allMetrics).length} classes`);

        // Categorize classes
        const categorizedMetrics = {};
        for (const category of Object.keys(CLASS_CATEGORIES)) {
            categorizedMetrics[category] = {};
        }

        for (const [className, xrayData] of Object.entries(allMetrics)) {
            // Find which category this class belongs to
            let category = 'Others';
            for (const [cat, classList] of Object.entries(CLASS_CATEGORIES)) {
                if (classList.includes(className)) {
                    category = cat;
                    break;
                }
            }

            categorizedMetrics[category][className] = xrayData;
        }

        console.log('📁 [CategoryAggregator] Categorized metrics:', {
            Pathology: Object.keys(categorizedMetrics['Pathology']).length,
            'Non-Pathology': Object.keys(categorizedMetrics['Non-Pathology']).length,
            'Tooth Parts': Object.keys(categorizedMetrics['Tooth Parts']).length,
            'Others': Object.keys(categorizedMetrics['Others']).length
        });

        // Save each category to history
        for (const [category, metrics] of Object.entries(categorizedMetrics)) {
            if (Object.keys(metrics).length > 0) {
                console.log(`💾 [CategoryAggregator] Saving ${category} with ${Object.keys(metrics).length} classes...`);
                await addCategoryToHistory(storage, category, metrics);
                console.log(`✅ [CategoryAggregator] Saved ${category}`);
            } else {
                console.log(`⚠️  [CategoryAggregator] Skipping ${category} - no metrics`);
            }
        }

        console.log('✅ [CategoryAggregator] refreshAllCategories completed successfully');
        return categorizedMetrics;
    } catch (error) {
        console.error('❌ [CategoryAggregator] Error in refreshAllCategories:', error);
        throw error;
    }
};

