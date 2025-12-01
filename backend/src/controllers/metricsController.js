import storage from '../storage/fileStorage.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';

/**
 * Get combined metrics from Kaggle data + Label Studio
 * Matches dash.py: get_all_combined_metrics()
 */
export const getCombinedMetrics = async (req, res) => {
    try {
        const kaggleData = await storage.loadKaggleData();
        const classPivotDB = await storage.loadClassPivotDB();

        // Collect all LS metrics from categories
        const allLSMetrics = {};
        for (const [category, data] of Object.entries(classPivotDB)) {
            const history = data.history || [];
            if (history.length > 0) {
                const latestMetrics = history[history.length - 1].metrics || {};
                // Merge into allLSMetrics
                for (const [className, xrayTypes] of Object.entries(latestMetrics)) {
                    if (!allLSMetrics[className]) {
                        allLSMetrics[className] = {};
                    }
                    for (const [xrayType, metrics] of Object.entries(xrayTypes)) {
                        if (!allLSMetrics[className][xrayType]) {
                            allLSMetrics[className][xrayType] = { images: 0, annotations: 0 };
                        }
                        allLSMetrics[className][xrayType].images += metrics.images || 0;
                        allLSMetrics[className][xrayType].annotations += metrics.annotations || 0;
                    }
                }
            }
        }

        // Get all unique classes
        const allClasses = new Set(Object.keys(allLSMetrics));
        for (const categoryData of Object.values(kaggleData)) {
            for (const className of Object.keys(categoryData)) {
                allClasses.add(className);
            }
        }

        // Build combined metrics
        const combined = {};
        for (const className of Array.from(allClasses).sort()) {
            combined[className] = {};

            // Determine class category
            let classCategory = 'Others';
            for (const [cat, classList] of Object.entries(CLASS_CATEGORIES)) {
                if (classList.includes(className)) {
                    classCategory = cat;
                    break;
                }
            }

            for (const xrayType of ['OPG', 'Bitewing', 'IOPA']) {
                const kaggleImgs = kaggleData[classCategory]?.[className]?.[xrayType]?.images || 0;
                const lsMetrics = allLSMetrics[className]?.[xrayType] || { images: 0, annotations: 0 };

                combined[className][xrayType] = {
                    kaggle_images: kaggleImgs,
                    ls_images: lsMetrics.images,
                    ls_annotations: lsMetrics.annotations,
                    total_images: kaggleImgs + lsMetrics.images
                };
            }
        }

        res.json(combined);
    } catch (error) {
        console.error('Error getting combined metrics:', error);
        res.status(500).json({ error: error.message });
    }
};
