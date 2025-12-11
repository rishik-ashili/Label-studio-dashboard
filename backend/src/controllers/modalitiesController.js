import { getAllModalities, setProjectModality } from '../services/modalityService.js';

/**
 * Modalities Controller
 * Handles modality-related API endpoints
 */

// GET /api/modalities - Get all project modalities
export const getModalities = async (req, res) => {
    try {
        const modalities = await getAllModalities();
        res.json(modalities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/modalities/:projectId - Update project modality
export const updateModality = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { modality } = req.body;

        // Validate modality
        const validModalities = ['OPG', 'Bitewing', 'IOPA', 'Others'];
        if (!validModalities.includes(modality)) {
            return res.status(400).json({
                error: `Invalid modality. Must be one of: ${validModalities.join(', ')}`
            });
        }

        const updatedModality = await setProjectModality(projectId, modality);

        res.json({
            success: true,
            projectId,
            modality: updatedModality
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
