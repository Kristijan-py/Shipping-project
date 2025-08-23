import fs from 'fs';
import { pool } from '../config/database.js'; // Database connection
import jwt from 'jsonwebtoken';



// Cleans unverified users every 20m
export function startCleanupInterval() {
    setInterval(async () => {
        try {
        const [result] = await pool.query(`
            DELETE FROM users
            WHERE is_verified = 0
            AND email_token is NOT NULL 
            AND email_token_expires < NOW()
        `);
        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Skopje' });
        const logEntry = `Deleted ${result.affectedRows} unverified users - ${timestamp}\n `;
            console.log(logEntry); // to see in the terminal when the interval passed

        fs.appendFile('../SHIPPING_SOFTWARE/logs/delete.log', logEntry, (err) => {
            if(err) {
                console.error('Error writing to the file ', err.message);
            }
        });

    } catch (error) {
        console.error('Error cleaning the unverified users', error.message);
    }
    }, 1000 * 60  * 20); // Refresh every 20 minutes
}

// TOKEN GENERATION
export async function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export async function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '15d' });
}


export async function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}
export async function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}
