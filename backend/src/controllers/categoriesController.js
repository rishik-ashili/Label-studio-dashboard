import storage from '../storage/fileStorage.js';

/**
 * Get history for a specific category
 */
export const getCategoryHistory = async (req, res) => {
    try {
        const category = req.params.category;
        const db = await storage.loadClassPivotDB();
        const history = db[category]?.history || [];

        res.json({ category, history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get latest metrics for a category
 */
export const getCategoryLatest = async (req, res) => {
    try {
        const category = req.params.category;
        const db = await storage.loadClassPivotDB();
        const history = db[category]?.history || [];

        if (!history.length) {
            return res.json({ category, metrics: {} });
        }

        const latest = history[history.length - 1];
        res.json({ category, ...latest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all categories with their latest metrics
 */
export const getAllCategories = async (req, res) => {
    try {
        const db = await storage.loadClassPivotDB();
        const categories = {};

        for (const [category, data] of Object.entries(db)) {
            const history = data.history || [];
            categories[category] = {
                history_count: history.length,
                latest: history.length > 0 ? history[history.length - 1] : null
            };
        }

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
