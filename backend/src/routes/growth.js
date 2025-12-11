import express from 'express';
import { getGrowthMetrics } from '../controllers/growthController.js';

const router = express.Router();

router.get('/', getGrowthMetrics);

export default router;
