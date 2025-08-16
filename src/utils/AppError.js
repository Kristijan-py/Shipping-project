// Custom error class to handle errors easier
// NOTE: USE ONLY WHERE EXPRESS IS CALLED
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent constructor
        this.statusCode = statusCode;
        this.isOperational = true; // Operational errors are expected and can be handled by the application
    }
}