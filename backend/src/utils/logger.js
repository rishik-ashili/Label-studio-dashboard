import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create transports
const transports = [
    // Console transport for development
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, source, ...meta }) => {
                const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}] ${source ? `[${source}] ` : ''}${message} ${metaString}`;
            })
        ),
        level: process.env.LOG_LEVEL || 'info'
    }),

    // Rotate file transport - keeps last 7 days
    new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'debug'
    }),

    // Error file transport
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
        level: 'error'
    })
];

// Create logger instance
const logger = winston.createLogger({
    transports,
    exitOnError: false
});

// Helper functions with structured logging
const createLog = (level, source, message, context = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
        context
    };
};

// Structured logging methods
export const logInfo = (source, message, context) => {
    logger.info(createLog('info', source, message, context));
};

export const logWarn = (source, message, context) => {
    logger.warn(createLog('warn', source, message, context));
};

export const logError = (source, message, context) => {
    logger.error(createLog('error', source, message, context));
};

export const logDebug = (source, message, context) => {
    logger.debug(createLog('debug', source, message, context));
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    req.requestId = requestId;

    logger.info(createLog('info', 'http:request', `${req.method} ${req.path}`, {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip
    }));

    // Log response
    const originalSend = res.send;
    res.send = function (data) {
        logger.info(createLog('info', 'http:response', `${req.method} ${req.path} - ${res.statusCode}`, {
            requestId,
            statusCode: res.statusCode
        }));
        originalSend.call(this, data);
    };

    next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
    logger.error(createLog('error', 'http:error', err.message, {
        requestId: req.requestId,
        stack: err.stack,
        path: req.path,
        method: req.method
    }));
    next(err);
};

export default logger;
