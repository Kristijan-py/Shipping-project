import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFilePath = path.join(__dirname, '..', 'logs', 'requests.log');

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

export function errorHandler(err, req, res, next) {
    if(res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({ error: err.message || "Internal Server Error"});
}

// Authenticate token
export function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    // Verify the token
    

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
}

// Redirect to dashboard if authenticated, otherwise next()
export function redirectIfAuthenticated(req, res, next) {
    const token = req.cookies?.token; // ? to safely access cookies if cookies are undefined
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (!err) return res.redirect('/dashboard'); // if no error, redirect to dashboard
            next(); // else continue to the next middleware
        });
    } else {
        next(); // no token, continue to the next middleware
    }
}


// Some pages are accessible only to admin roles, that's why we need this middleware
export function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.redirect('/dashboard'); // redirect to dashboard if not admin
    }
}