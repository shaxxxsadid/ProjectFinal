import { connect, connection, disconnect } from 'mongoose';
import { logger } from './logger';
interface DBConfig {
    readonly uri: string;
    readonly options?: object;
}

class DB implements DBConfig {
    private readonly uri: string;
    private readonly options: object;
    private isConnected: boolean = false;

    constructor(config: DBConfig) {
        this.uri = config.uri;
        this.options = config.options || {};
    }

    async connect() {
        if (this.isConnected) {
            console.warn('Database is already connected');
            return;
        }

        try {
            await connect(this.uri, this.options);
            this.isConnected = true;
            logger.info('Database connection established');
            connection.on('error', (err) => {
                logger.error('Database connection error:', err);
                this.isConnected = false;
            });
            connection.on('disconnected', () => {
                logger.warn('Database connection lost');
                this.isConnected = false;
            });
        }
        catch (error) {
            logger.error({
                msg: 'DB: failed to connect',
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            logger.warn('Database is already disconnected');
            return;
        }

        try {
            await disconnect();
            this.isConnected = false;
            logger.info('Database connection closed');
        }
        catch (error) {
            logger.error({
                msg: 'DB: error during disconnect',
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }

    get status() {
        return {
            isConnected: this.isConnected,
            // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            readyState: connection.readyState,
        };
    }
}

export const db = new DB({
    uri: process.env.MONGODB_URI!,
    options: {
        maxPoolSize: 10, // пул соединений
    },
})