import cron from 'node-cron';
import labelStudioService from './labelStudio.js';
import { extractClassMetrics, addMetricsToHistory } from './metricsExtractor.js';
import { checkProjectTrainingReadiness, addNotification } from './notificationService.js';
import { storeSnapshot } from './timeSeriesService.js';
import storage from '../storage/fileStorage.js';
import { CLASS_CATEGORIES } from '../utils/constants.js';
import { detectXrayType } from '../utils/xrayDetector.js';

/**
 * Scheduler Service
 * Handles automated data refresh scheduling
 * Matches Python: SchedulerManager class
 */
class SchedulerService {
    constructor() {
        this.task = null;
        this.isRunning = false;
        this.init();
    }

    async init() {
        // Auto-start scheduler if it was enabled before
        const config = await storage.loadSchedulerConfig();
        if (config.enabled) {
            try {
                await this.start(config.hour, config.minute);
            } catch (error) {
                console.warn('Could not auto-start scheduler:', error.message);
            }
        }
    }

    /**
     * Calculate next run time based on current time and schedule
     */
    calculateNextRun(hour, minute) {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(hour, minute, 0, 0);

        // If the scheduled time has already passed today, schedule for tomorrow
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun.toISOString();
    }

    /**
     * Refresh all projects and categories
     * Matches Python: refresh_all_data()
     */
    async refreshAllData() {
        try {
            await storage.appendSchedulerLog('=== Starting scheduled refresh ===');

            // Get all projects
            const projects = await labelStudioService.getAllProjects();
            await storage.appendSchedulerLog(`Found ${projects.length} projects`);

            // Refresh each project
            for (let idx = 0; idx < projects.length; idx++) {
                const project = projects[idx];
                const projectId = project.id;
                const projectTitle = project.title || `Project ${projectId}`;

                try {
                    await storage.appendSchedulerLog(`[${idx + 1}/${projects.length}] Refreshing: ${projectTitle}`);

                    const tasks = await labelStudioService.getProjectTasks(projectId);
                    const metrics = extractClassMetrics(tasks);
                    await addMetricsToHistory(storage, projectId, metrics);

                    // Check for notifications
                    const notifications = await checkProjectTrainingReadiness(storage, projectId, projectTitle);
                    for (const notif of notifications) {
                        await addNotification(storage, notif);
                    }

                    await storage.appendSchedulerLog(`  ✓ Completed: ${projectTitle}`);
                } catch (error) {
                    await storage.appendSchedulerLog(`  ✗ Error refreshing ${projectTitle}: ${error.message}`);
                }
            }

            // Store time series snapshot for today
            await storage.appendSchedulerLog('Creating daily time series snapshot...');
            await storeSnapshot();
            await storage.appendSchedulerLog('  ✓ Time series snapshot created');

            // Update last run time and calculate next run
            const config = await storage.loadSchedulerConfig();
            config.last_run = new Date().toISOString();
            config.next_run = this.calculateNextRun(config.hour || 2, config.minute || 8);
            await storage.saveSchedulerConfig(config);

            await storage.appendSchedulerLog('=== Scheduled refresh completed successfully ===\n');
        } catch (error) {
            await storage.appendSchedulerLog(`Fatal error in scheduled refresh: ${error.message}`);
        }
    }

    /**
     * Start the scheduler
     * Matches Python: start_scheduler()
     */
    async start(hour = 2, minute = 8) {
        if (this.isRunning) {
            throw new Error('Scheduler already running');
        }

        // Create cron expression (minute hour * * *)
        const cronExpression = `${minute} ${hour} * * *`;

        // Schedule the job
        this.task = cron.schedule(cronExpression, () => {
            this.refreshAllData();
        });

        this.isRunning = true;

        // Update config
        const config = await storage.loadSchedulerConfig();
        config.enabled = true;
        config.hour = hour;
        config.minute = minute;
        config.next_run = this.calculateNextRun(hour, minute);

        await storage.saveSchedulerConfig(config);
        await storage.appendSchedulerLog(`Scheduler started: Daily refresh at ${hour}:${String(minute).padStart(2, '0')}`);

        return true;
    }

    /**
     * Stop the scheduler
     * Matches Python: stop_scheduler()
     */
    async stop() {
        if (!this.isRunning) {
            return false;
        }

        if (this.task) {
            this.task.stop();
            this.task = null;
        }

        this.isRunning = false;

        // Update config
        const config = await storage.loadSchedulerConfig();
        config.enabled = false;
        config.next_run = null;
        await storage.saveSchedulerConfig(config);

        await storage.appendSchedulerLog('Scheduler stopped');

        return true;
    }

    /**
     * Get scheduler status
     * Matches Python: get_status()
     */
    async getStatus() {
        const config = await storage.loadSchedulerConfig();

        const status = {
            enabled: config.enabled || false,
            is_running: this.isRunning,
            schedule: `${String(config.hour || 2).padStart(2, '0')}:${String(config.minute || 8).padStart(2, '0')}`,
            hour: config.hour || 2,
            minute: config.minute || 8,
            last_run: config.last_run || null,
            next_run: config.next_run || null
        };

        return status;
    }

    /**
     * Trigger manual refresh
     * Matches Python: trigger_manual_refresh()
     */
    async triggerManual() {
        await storage.appendSchedulerLog('Manual refresh triggered');
        // Run in background (don't await)
        setImmediate(() => this.refreshAllData());
        return true;
    }
}

// Export singleton instance
const schedulerService = new SchedulerService();
export default schedulerService;
