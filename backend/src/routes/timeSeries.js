import express from 'express';
import { getTimeSeriesMetrics } from '../controllers/timeSeriesController.js';

const router = express.Router();

router.get('/', getTimeSeriesMetrics);

export default router;
