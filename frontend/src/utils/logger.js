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

        const logsToSend = [...this.logQueue];
        this.logQueue = [];

        try {
            await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logsToSend)
            });
        } catch (error) {
            // Silent fail - don't create infinite loop
            console.error('Failed to send logs to backend:', error);
        }
    }

    startBatchSending() {
        setInterval(() => {
            this.sendBatch();
        }, this.batchInterval);

        // Send logs before page unload
        window.addEventListener('beforeunload', () => {
            if (this.logQueue.length > 0) {
                // Use sendBeacon for reliable delivery during page unload
                const blob = new Blob([JSON.stringify(this.logQueue)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(this.apiEndpoint, blob);
            }
        });
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
