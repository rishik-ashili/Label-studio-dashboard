import express from 'express';
import {
    getAllProjects,
    getProject,
    refreshProject,
    refreshAllProjects
} from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:id', getProject);
router.post('/:id/refresh', refreshProject);
router.post('/refresh-all', refreshAllProjects);

export default router;
