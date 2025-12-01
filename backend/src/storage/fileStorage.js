import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File-based storage manager
 * Thread-safe JSON file operations
 */
class FileStorage {
    constructor(cacheDir = './storage/cache') {
        this.cacheDir = path.resolve(cacheDir);
        this.locks = new Map(); // Simple in-memory lock system
    }

    async ensureCacheDir() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }

    getFilePath(filename) {
        return path.join(this.cacheDir, filename);
    }

    async readJSON(filename, defaultValue = {}) {
        const filePath = this.getFilePath(filename);
        let retries = 3;

        while (retries > 0) {
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return defaultValue;
                }

                // Retry on lock/busy errors
                if (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EAGAIN') {
                    retries--;
                    if (retries === 0) {
                        console.error(`Failed to read ${filename} after retries:`, error);
                        throw error; // CRITICAL: Throw instead of returning default to prevent overwrite
                    }
                    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
                    continue;
                }

                console.error(`Error reading ${filename}:`, error);
                throw error; // CRITICAL: Throw instead of returning default
            }
        }
    }

    async writeJSON(filename, data) {
        await this.ensureCacheDir();
        const filePath = this.getFilePath(filename);

        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            return false;
        }
    }

    async appendToFile(filename, content) {
        await this.ensureCacheDir();
        const filePath = this.getFilePath(filename);

        try {
            await fs.appendFile(filePath, content + '\n', 'utf-8');
            return true;
        } catch (error) {
            console.error(`Error appending to ${filename}:`, error);
            return false;
        }
    }

    async readTextFile(filename, defaultValue = '') {
        const filePath = this.getFilePath(filename);

        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                return defaultValue;
            }
            console.warn(`Error reading ${filename}:`, error.message);
            return defaultValue;
        }
    }

    // Persistent metrics
    async loadPersistentDB() {
        return await this.readJSON('persistent_metrics.json', {});
    }

    async savePersistentDB(db) {
        return await this.writeJSON('persistent_metrics.json', db);
    }

    // Checkpoints
    async loadCheckpoints() {
        return await this.readJSON('checkpoints.json', { projects: {}, categories: {}, classes: {} });
    }

    async saveCheckpoints(checkpoints) {
        return await this.writeJSON('checkpoints.json', checkpoints);
    }

    // Notifications
    async loadNotifications() {
        return await this.readJSON('notifications.json', []);
    }

    async saveNotifications(notifications) {
        return await this.writeJSON('notifications.json', notifications);
    }

    // Class pivot metrics
    async loadClassPivotDB() {
        return await this.readJSON('class_pivot_metrics.json', {});
    }

    async saveClassPivotDB(db) {
        return await this.writeJSON('class_pivot_metrics.json', db);
    }

    // Training marks
    async loadTrainingMarks() {
        return await this.readJSON('training_marks.json', {});
    }

    async saveTrainingMarks(marks) {
        return await this.writeJSON('training_marks.json', marks);
    }

    // Kaggle data
    async loadKaggleData() {
        return await this.readJSON('kaggle_data.json', {
            Pathology: {},
            'Non-Pathology': {},
            'Tooth Parts': {},
            Others: {}
        });
    }

    async saveKaggleData(data) {
        return await this.writeJSON('kaggle_data.json', data);
    }

    // Scheduler config
    async loadSchedulerConfig() {
        return await this.readJSON('scheduler_config.json', {
            enabled: false,
            hour: 2,
            minute: 8,
            last_run: null,
            next_run: null
        });
    }

    async saveSchedulerConfig(config) {
        return await this.writeJSON('scheduler_config.json', config);
    }

    // Scheduler logs
    async appendSchedulerLog(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}`;
        return await this.appendToFile('scheduler_log.txt', logMessage);
    }

    async getSchedulerLogs(lines = 50) {
        const content = await this.readTextFile('scheduler_log.txt', '');
        const allLines = content.split('\n').filter(line => line.trim());
        return allLines.slice(-lines).join('\n');
    }
}

// Export singleton instance
// Export singleton instance
const storage = new FileStorage(process.env.CACHE_DIR || path.join(__dirname, 'cache'));
await storage.ensureCacheDir();

export default storage;
