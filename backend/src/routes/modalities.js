import express from 'express';
import { getModalities, updateModality } from '../controllers/modalitiesController.js';

const router = express.Router();

router.get('/', getModalities);
router.put('/:projectId', updateModality);

export default router;
