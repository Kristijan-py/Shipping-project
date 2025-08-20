import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss'
        }),
        winston.format.errors({ stack: false }),
        winston.format.json()
        
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.prettyPrint(),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} ${level}: ${message} ${metaString}`;
                })
            )
        }),    
        new winston.transports.File({ 
            filename: 'logs/standard.log',
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss'
                }),
                winston.format.errors({ stack: false }),
                winston.format.prettyPrint(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} ${level}: ${message} ${metaString}`;
                })
            )
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss'
                }),
                winston.format.errors({ stack: false }),
                winston.format.prettyPrint(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} ${level}: ${message} ${metaString}`;
                })
            )
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: 'logs/exceptions.log', 
            format: winston.format.errors({ stack: false })
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: 'logs/rejections.log',
            format: winston.format.errors({ stack: false })
        })
    ]

});