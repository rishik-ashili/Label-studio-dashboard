import express from 'express';
import {
    getAllProjects,
    getProject,
    refreshProject,
    refreshAllProjects,
    getRefreshProgress
} from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:id', getProject);
router.post('/:id/refresh', refreshProject);
router.post('/refresh-all', refreshAllProjects);
router.get('/refresh-progress', getRefreshProgress);

export default router;
