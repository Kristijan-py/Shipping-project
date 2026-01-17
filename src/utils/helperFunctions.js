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
    }, 1000 * 60  * 30); // Refresh every 30 minutes
}

// TOKEN GENERATION
export async function generateAccessToken(payload, rememberMe = true) { // rememberMe true to see if user logged in with remember me option(manually not with OAuth)
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: rememberMe ? '15m' : '5m' });
};

export async function generateRefreshToken(payload, rememberMe = true) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: rememberMe ? '15d' : '12h' });
};

// TOKEN VERIFICATION
export async function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
            algorithms: ['HS256'] // hashing the algorithm if attacker tries to change the alg in header to none and gain entrance without jwt verify
        });
        return decoded;
    } catch (error) {
        return null;
    }
}
export async function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
            algorithms: ['HS256'] // hashing the algorithm if attacker tries to change the alg in header to none and gain entrance without jwt verify
        });
        return decoded;
    } catch (error) {
        return null;
    }
}




// ADDING +389
export function normalizePhoneNumber(phone) {
    let digits = phone.replace(/\D/g,'');

    if(digits.startsWith('0')) { // 077446614 --> +38977446614
        digits = digits.slice(1); // remove 0
        digits = '+' + 389 + digits;
        return digits;
    } else {
        return 'Your number must start with 07...';
    }  
};