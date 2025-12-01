import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.resolve(__dirname, '../storage/cache');
const PERSISTENT_DB_PATH = path.join(CACHE_DIR, 'persistent_metrics.json');
const CHECKPOINTS_PATH = path.join(CACHE_DIR, 'checkpoints.json');

async function migrate() {
    console.log('Starting migration...');
    console.log(`Cache directory: ${CACHE_DIR}`);

    try {
        // 1. Load existing persistent DB or create new
        let db = {};
        try {
            const dbContent = await fs.readFile(PERSISTENT_DB_PATH, 'utf-8');
            db = JSON.parse(dbContent);
        } catch (e) {
            console.log('No existing persistent DB found, creating new.');
        }

        // 2. Load checkpoints to get project list and baseline metrics
        let checkpoints = { projects: {} };
        try {
            const cpContent = await fs.readFile(CHECKPOINTS_PATH, 'utf-8');
            checkpoints = JSON.parse(cpContent);
        } catch (e) {
            console.log('No checkpoints found.');
        }

        // 3. Scan for project_{id}_metrics.json files
        const files = await fs.readdir(CACHE_DIR);
        const metricFiles = files.filter(f => f.match(/^project_\d+_metrics\.json$/));

        console.log(`Found ${metricFiles.length} metric files.`);

        for (const file of metricFiles) {
            const projectId = file.match(/^project_(\d+)_metrics\.json$/)[1];
            const content = await fs.readFile(path.join(CACHE_DIR, file), 'utf-8');
            const data = JSON.parse(content);

            if (!db[projectId]) {
                db[projectId] = { history: [] };
            }

            // Check if this entry already exists
            const exists = db[projectId].history.some(h => h.timestamp === data.timestamp);
            if (!exists) {
                db[projectId].history.push({
                    timestamp: data.timestamp,
                    metrics: data.metrics
                });
                console.log(`Added metrics for project ${projectId} from file.`);
            }
        }

        // 4. Also add checkpoint metrics as history points if they don't exist
        // This ensures we have at least the checkpoint state in history
        for (const [projectId, cp] of Object.entries(checkpoints.projects)) {
            if (!db[projectId]) {
                db[projectId] = { history: [] };
            }

            // Checkpoint timestamp might be different from metrics timestamp
            // But usually checkpoint.metrics is what we want.
            // We'll use checkpoint.timestamp as the history timestamp.

            const exists = db[projectId].history.some(h => h.timestamp === cp.timestamp);
            if (!exists) {
                db[projectId].history.push({
                    timestamp: cp.timestamp,
                    metrics: cp.metrics
                });
                console.log(`Added checkpoint metrics for project ${projectId} to history.`);
            }
        }

        // 5. Sort history by timestamp
        for (const projectId in db) {
            db[projectId].history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // 6. Save DB
        await fs.writeFile(PERSISTENT_DB_PATH, JSON.stringify(db, null, 2));
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
