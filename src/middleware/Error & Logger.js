import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFilePath = path.join(__dirname, '..', '..', 'logs', 'requests.log');



// LOGGER
/*
export function logger(req, res, next) {
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Skopje' });
    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl} - ${timestamp}\n`); // also log to console

    const logEntry = `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl} - ${timestamp}\n`;
    
    fs.appendFile(logFilePath, logEntry, (err) => { // creating log file
        if(err) {
            console.error('Error writing to log file:', err.message);
        }
    })
    next();
} 
*/

// CUSTOM ERROR HANDLER
export function errorHandler(err, req, res, next) { // no "next" parameter because is in the bottom, no more middlewares
    if(err instanceof AppError) {
        logger.warn(`${err.message}`,{ status: err.statusCode || 500, method: req.method, url: req.originalUrl });
        return res.status(err.statusCode).json({error: err.message});
    }
    logger.error(`${err.message}`, { status: err.statusCode || 500, method: req.method, url: req.originalUrl });
    res.status(500).json({ error: "Internal Server Error"});
}

