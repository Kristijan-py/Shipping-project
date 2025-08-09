import { pool } from './database.js';
import fs from 'fs';

export function startCleanupInterval() {
    setInterval(async () => {
        console.log('Zaso ne rabotes');

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