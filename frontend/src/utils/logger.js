// Frontend logging utility
// Batches logs and sends to backend every 5 seconds

class Logger {
    constructor() {
        this.logQueue = [];
        this.batchInterval = 5000; // 5 seconds
        this.maxQueueSize = 50;
        this.apiEndpoint = '/api/logs/frontend';

        // Start batch sending
        this.startBatchSending();

        // Bind methods
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);
        this.debug = this.debug.bind(this);
    }

    createLogEntry(level, source, message, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };
    }

    addToQueue(logEntry) {
        this.logQueue.push(logEntry);

        // If queue is full, send immediately
        if (this.logQueue.length >= this.maxQueueSize) {
            this.sendBatch();
        }
    }

    info(source, message, context) {
        const logEntry = this.createLogEntry('info', source, message, context);
        this.addToQueue(logEntry);
        console.log(`[INFO] [${source}]`, message, context);
    }

    warn(source, message, context) {
        const logEntry = this.createLogEntry('warn', source, message, context);
        this.addToQueue(logEntry);
        console.warn(`[WARN] [${source}]`, message, context);
    }

    error(source, message, context) {
        const logEntry = this.createLogEntry('error', source, message, context);
        this.addToQueue(logEntry);

        // Errors are sent immediately
        this.sendBatch();

        console.error(`[ERROR] [${source}]`, message, context);
    }

    debug(source, message, context) {
        if (process.env.NODE_ENV === 'development') {
            const logEntry = this.createLogEntry('debug', source, message, context);
            this.addToQueue(logEntry);
            console.debug(`[DEBUG] [${source}]`, message, context);
        }
    }

    async sendBatch() {
        if (this.logQueue.length === 0) return;

        // Clear queue without sending to backend (disabled to prevent 404 errors)
        this.logQueue = [];

        // NOTE: Remote logging disabled - logs only go to browser console
        // If you want to enable backend logging, create POST /api/logs/frontend endpoint
    }

    startBatchSending() {
        // Disabled batch sending to prevent 404 errors
        // Logs are only written to browser console

        // NOTE: If you want to enable backend logging:
        // 1. Create POST /api/logs/frontend endpoint in backend
        // 2. Uncomment the setInterval and beforeunload code below

        /*
        setInterval(() => {
            this.sendBatch();
        }, this.batchInterval);

        window.addEventListener('beforeunload', () => {
            if (this.logQueue.length > 0) {
                const blob = new Blob([JSON.stringify(this.logQueue)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(this.apiEndpoint, blob);
            }
        });
        */
    }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Named exports for convenience
export const logInfo = (source, message, context) => logger.info(source, message, context);
export const logWarn = (source, message, context) => logger.warn(source, message, context);
export const logError = (source, message, context) => logger.error(source, message, context);
export const logDebug = (source, message, context) => logger.debug(source, message, context);
