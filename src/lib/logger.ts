import prisma from './prisma';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO';

export class Logger {
    private static instance: Logger;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Log a message to the database and console
     */
    public async log(level: LogLevel, service: string, message: string, error?: any) {
        // 1. Console Log (Immediate)
        const timestamp = new Date().toISOString();
        const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${icon} [${service}] ${message}`);

        // 2. Database Log (Persistence - Fire and forget)
        // Skip silently if no database is configured in this environment
        if (!process.env.DATABASE_URL) return;

        try {
            prisma.log.create({
                data: {
                    level,
                    service,
                    message: message.substring(0, 5000),
                    stack: error instanceof Error ? error.stack : (error ? String(error) : null),
                }
            }).catch(() => { /* silently ignore db log failures */ });
        } catch {
            // silently ignore
        }
    }

    public error(service: string, message: string, error?: any) {
        return this.log('ERROR', service, message, error);
    }

    public warn(service: string, message: string) {
        return this.log('WARN', service, message);
    }

    public info(service: string, message: string) {
        return this.log('INFO', service, message);
    }
}

export const logger = Logger.getInstance();
