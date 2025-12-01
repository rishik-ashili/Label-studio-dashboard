import express from 'express';
import { getCategoryHistory, getCategoryLatest, getAllCategories } from '../controllers/categoriesController.js';

const router = express.Router();

// Get all categories
router.get('/', getAllCategories);

// Get category history
router.get('/:category/history', getCategoryHistory);

// Get latest metrics for category
router.get('/:category/latest', getCategoryLatest);

export default router;
