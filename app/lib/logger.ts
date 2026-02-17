import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
    level: isDev ? process.env.LOG_LEVEL : 'info',
    transport: isDev ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
    base: {
        env: process.env.NODE_ENV,
        service: 'Corp. Web App',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: ['req.headers.authorization', 'req.body.password', '*.token'],
        censor: '[REDACTED]',
    }
})