import storage from '../storage/fileStorage.js';
import {
    addProjectCheckpoint,
    getProjectCheckpoint,
    addCategoryCheckpoint,
    getCategoryCheckpoint,
    addClassCheckpoint,
    getClassCheckpoint
} from '../services/checkpointService.js';
import { clearProjectNotifications } from '../services/notificationService.js';

// GET /api/checkpoints - Get all checkpoints
export const getAllCheckpoints = async (req, res) => {
    try {
        const checkpoints = await storage.loadCheckpoints();
        res.json(checkpoints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/checkpoints/project/:id - Create project checkpoint
export const createProjectCheckpoint = async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const { project_title, note } = req.body;

        const success = await addProjectCheckpoint(storage, projectId, project_title, note || '');

        if (success) {
            // Clear notifications for this project
            await clearProjectNotifications(storage, projectId);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'No history available for project' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/checkpoints/category/:name - Create category checkpoint
export const createCategoryCheckpoint = async (req, res) => {
    try {
        const category = req.params.name;
        const { note } = req.body;

        const success = await addCategoryCheckpoint(storage, category, note || '');

        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'No history available for category' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/checkpoints/class - Create class checkpoint
export const createClassCheckpoint = async (req, res) => {
    try {
        const { class_name, xray_type, note } = req.body;

        const success = await addClassCheckpoint(storage, class_name, xray_type, note || '');

        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
