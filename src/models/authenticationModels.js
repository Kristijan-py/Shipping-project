import { pool } from '../config/database.js'; // Database connection

// Checking user from database to see if it exists
export async function ifUserExists(email, phone) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    return rows.length > 0; // ITS BOOLEAN => if we found 1 user return true, otherwise false
}

// insert user email token for verification
export async function insertUserEmailToken(emailToken, expires, email){
    const [result] = await pool.query('UPDATE users SET email_token = ?, email_token_expires = ? WHERE email = ?', [emailToken, expires, email]);
    return result.affectedRows > 0;
}

// find the user by email with email token for verification
export async function findUserByEmailToken(emailToken) {
    const [result] = await pool.query('SELECT * FROM users WHERE email_token = ? AND email_token_expires > NOW()', [emailToken]);
    return result;
};

// verify the user 
export async function verifyUserEmail(email) {
    const [result] = await pool.query('UPDATE users SET is_verified = 1, email_token = NULL, email_token_expires = NULL WHERE email = ?', [email]);
    return result.affectedRows > 0;
}

// insert user reset token for password reset
export async function insertUserResetToken(resetToken, expires, email) {
    const [result] = await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [resetToken, expires, email]);
    return result.affectedRows > 0;

};

// find the user by email with reset token for password reset
export async function findUserByResetToken(resetToken) {
    const [result] = await pool.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [resetToken]);
    return result;
};


// set the new password
export async function updateUserPassword(email, newPassword) {
    const [result] = await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [newPassword, email]);
    return result.affectedRows > 0;
};