import { pool } from '../config/database.js'; // Database connection
import { AppError } from '../utils/AppError.js';

// insert user email token for verification
export async function insertUserEmailToken(emailToken, expires, email){
    try {
        if (!email || !emailToken || !expires) {
            throw new AppError('Email, token, and expiration date are required', 400);
        }
        const [result] = await pool.query('UPDATE users SET email_token = ?, email_token_expires = ? WHERE email = ?', [emailToken, expires, email]);
        return result;
    } catch (error) {
        throw new AppError(`Error inserting email token: ${error.message}`, 500);
    }
}

// find the user by email with email token for verification
export async function findUserByEmailToken(emailToken) {
    try {
        if (!emailToken) {
            throw new AppError('No email token', 400);
        }

        const [result] = await pool.query('SELECT * FROM users WHERE email_token = ? AND email_token_expires > NOW()', [emailToken]);
        return result;
    } catch (error) {
        throw new AppError(`Error finding user by email token: ${error.message}`, 500);
    }
};

// verify the user 
export async function verifyUserEmail(email) {
    try {
        if (!email) {
            throw new AppError('Email is required', 400);
        }

        const [result] = await pool.query('UPDATE users SET is_verified = 1, email_token = NULL, email_token_expires = NULL WHERE email = ?', [email]);
        return result;
    } catch (error) {
        throw new AppError(`Error verifying user email: ${error.message}`, 500);
    }
}

// insert user reset token for password reset
export async function insertUserResetToken(resetToken, expires, email) {
    try {
        if (!email || !resetToken || !expires) {
            throw new AppError('Email, resetToken, and expiration date are required', 400);
        }

        const [result] = await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [resetToken, expires, email]);
        return result;
    } catch (error) {
        throw new AppError(`Error inserting user reset token: ${error.message}`, 500);
    }
};

// find the user by email with reset token for password reset
export async function findUserByResetToken(resetToken) {
    try {
        if (!resetToken) {
            throw new AppError('Email and resetToken are required', 400);
        }

        const [result] = await pool.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [resetToken]);
        return result;
    } catch (error) {
        throw new AppError(`Error finding user by reset token: ${error.message}`, 500);
    }
};


// set the new password
export async function updateUserPassword(email, newPassword) {
    try {
        if (!email || !newPassword) {
            throw new AppError('Email and newPassword are required', 400);
        }

        const [result] = await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [newPassword, email]);
        return result;
    } catch (error) {
        throw new AppError(`Error updating user password: ${error.message}`, 500);
    }
};

export async function removeTokenWhenLogout(email) {
    try {
        if(!email) {
            throw new AppError('Email is required', 400);
        }

        const [result] = await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [email]);
        return result;
    } catch (error) {
        throw new AppError(`Error removing tokens from DB: ${error.message}`, 500 );
    }
}