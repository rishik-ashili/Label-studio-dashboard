import express from 'express';
import {
    getStatus,
    startScheduler,
    stopScheduler,
    triggerManual,
    getLogs
} from '../controllers/schedulerController.js';

const router = express.Router();

router.get('/status', getStatus);
router.post('/start', startScheduler);
router.post('/stop', stopScheduler);
router.post('/trigger', triggerManual);
router.get('/logs', getLogs);

export default router;
