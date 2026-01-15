import { AppError } from '../utils/AppError.js'; // for expected client errors
import { logger } from '../config/logger.js';





// CUSTOM ERROR HANDLER
export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isOperational = err instanceof AppError;

    // Log everything as error so it goes into errors.log
    logger.error({
        message: err.message,
        stack: err.stack || null,
        status: statusCode,
        method: req.method,
        url: req.originalUrl
    });

    // Response
    const message = isOperational ? err.message : "Internal Server Error";
    res.status(statusCode).json({ error: message });
}


