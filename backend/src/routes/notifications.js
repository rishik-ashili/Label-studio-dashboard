import express from 'express';
import { getNotifications, dismissNotif } from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', getNotifications);
router.delete('/:index', dismissNotif);

export default router;
