import express from 'express';
import {
    getAllCheckpoints,
    createProjectCheckpoint,
    createCategoryCheckpoint,
    createClassCheckpoint
} from '../controllers/checkpointsController.js';

const router = express.Router();

router.get('/', getAllCheckpoints);
router.post('/project/:id', createProjectCheckpoint);
router.post('/category/:name', createCategoryCheckpoint);
router.post('/class', createClassCheckpoint);

export default router;
