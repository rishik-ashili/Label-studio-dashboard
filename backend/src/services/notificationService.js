import { calculateIncreasePct } from '../utils/deltaCalculator.js';
import { getProjectHistory } from './metricsExtractor.js';
import { getProjectCheckpoint } from './checkpointService.js';

/**
 * Notification Service
 * Handles training readiness notifications
 */

/**
 * Check if project has ≥20% increase from checkpoint
 * Matches Python: check_project_training_readiness()
 */
export const checkProjectTrainingReadiness = async (storage, projectId, projectTitle) => {
    const checkpoint = await getProjectCheckpoint(storage, projectId);

    if (!checkpoint) {
        return [];
    }

    const history = await getProjectHistory(storage, projectId);
    if (history.length === 0) {
        return [];
    }

    const currentMetrics = history[history.length - 1].metrics;
    const checkpointMetrics = checkpoint.metrics;
    const threshold = parseInt(process.env.RETRAIN_THRESHOLD) || 20;

    const notifications = [];

    for (const className of Object.keys(currentMetrics)) {
        if (className === '_summary') continue;

        const currCount = currentMetrics[className]?.image_count || 0;
        const checkpointCount = checkpointMetrics[className]?.image_count || 0;

        if (checkpointCount > 0) {
            const increasePct = calculateIncreasePct(currCount, checkpointCount);

            if (increasePct >= threshold) {
                notifications.push({
                    type: 'project',
                    project_id: projectId,
                    project_title: projectTitle,
                    class_name: className,
                    increase_pct: increasePct,
                    current_count: currCount,
                    checkpoint_count: checkpointCount,
                    checkpoint_date: checkpoint.timestamp,
                    timestamp: history[history.length - 1].timestamp
                });
            }
        }
    }

    return notifications;
};

/**
 * Add notification
 */
export const addNotification = async (storage, notification) => {
    const notifications = await storage.loadNotifications();

    const notifKey = `${notification.project_id}_${notification.class_name}`;
    const existing = notifications.find(n =>
        `${n.project_id}_${n.class_name}` === notifKey
    );

    if (!existing) {
        notifications.push(notification);
        await storage.saveNotifications(notifications);
    }
};

/**
 * Dismiss notification
 */
export const dismissNotification = async (storage, index) => {
    const notifications = await storage.loadNotifications();

    if (index >= 0 && index < notifications.length) {
        notifications.splice(index, 1);
        await storage.saveNotifications(notifications);
        return true;
    }

    return false;
};

/**
 * Clear notifications for project
 */
export const clearProjectNotifications = async (storage, projectId) => {
    const notifications = await storage.loadNotifications();
    const filtered = notifications.filter(n => n.project_id !== projectId);
    await storage.saveNotifications(filtered);
};
