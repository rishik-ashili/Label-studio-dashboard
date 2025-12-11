import { detectXrayType } from '../utils/xrayDetector.js';
import storage from '../storage/fileStorage.js';

/**
 * Modality Service
 * Manages project modality tags (OPG, Bitewing, IOPA, Others)
 */

/**
 * Get modality for a project
 * Returns stored modality or auto-detects from project title
 */
export const getProjectModality = async (projectId, projectTitle) => {
    const modalities = await storage.loadProjectModalities();
    const projectKey = String(projectId);

    // Return stored modality if exists
    if (modalities[projectKey]) {
        return modalities[projectKey];
    }

    // Auto-detect from project title
    const detectedModality = detectXrayType(projectTitle);
    return detectedModality;
};

/**
 * Set/update modality for a project
 */
export const setProjectModality = async (projectId, modality) => {
    const modalities = await storage.loadProjectModalities();
    const projectKey = String(projectId);

    modalities[projectKey] = modality;
    await storage.saveProjectModalities(modalities);

    return modality;
};

/**
 * Initialize modalities for all projects
 * Auto-detects from project titles if not already stored
 */
export const initializeModalities = async (projects) => {
    const modalities = await storage.loadProjectModalities();
    let hasChanges = false;

    for (const project of projects) {
        const projectKey = String(project.id);

        // Only auto-detect if not already stored
        if (!modalities[projectKey]) {
            modalities[projectKey] = detectXrayType(project.title);
            hasChanges = true;
        }
    }

    if (hasChanges) {
        await storage.saveProjectModalities(modalities);
    }

    return modalities;
};

/**
 * Get all project modalities
 */
export const getAllModalities = async () => {
    return await storage.loadProjectModalities();
};
