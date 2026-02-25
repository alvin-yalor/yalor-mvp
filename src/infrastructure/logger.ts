import pino from 'pino';
import path from 'path';

// Define the root log directory (one level up from src/infrastructure)
const logFile = path.join(process.cwd(), 'logs', 'ace.log');

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        targets: [
            // 1. Write structured JSON logs to a persistent system file
            {
                target: 'pino/file',
                options: { destination: logFile, mkdir: true },
                level: process.env.LOG_LEVEL || 'info',
            },
            // 2. Output pretty readable logs to the console during development
            {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
                level: process.env.LOG_LEVEL || 'info',
            }
        ]
    }
});
