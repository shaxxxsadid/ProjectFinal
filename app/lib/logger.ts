const isDev = process.env.NODE_ENV === 'development';
const LOG_LEVEL = isDev ? (process.env.LOG_LEVEL || 'debug') : 'info';

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

class SimpleLogger {
    private level: LogLevel = 'info';

    constructor(level: LogLevel = 'info') {
        this.level = level;
    }

    private log(level: LogLevel, message: string, data?: unknown) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    debug(message: string, data?: unknown) {
        this.log('debug', message, data);
    }

    info(message: string, data?: unknown) {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.log('warn', message, data);
    }

    error(message: string | object, data?: unknown) {
        if (typeof message === 'object') {
            this.log('error', JSON.stringify(message), data);
        } else {
            this.log('error', message, data);
        }
    }
}

export const logger = new SimpleLogger((LOG_LEVEL as LogLevel) || 'info');