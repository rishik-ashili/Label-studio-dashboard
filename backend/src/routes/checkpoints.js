import express from 'express';
import {
    getAllCheckpoints,
    createProjectCheckpoint,
    createCategoryCheckpoint,
    createClassCheckpoint,
    updateProjectNote,
    updateCategoryNote,
    updateClassNote
} from '../controllers/checkpointsController.js';

const router = express.Router();

router.get('/', getAllCheckpoints);
router.post('/project/:id', createProjectCheckpoint);
router.post('/category/:name', createCategoryCheckpoint);
router.post('/class', createClassCheckpoint);

// Update routes
router.put('/project/:id/note', updateProjectNote);
router.put('/category/:name/note', updateCategoryNote);
router.put('/class/note', updateClassNote);

export default router;
