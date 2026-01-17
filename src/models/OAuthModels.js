import { pool } from '../config/database.js'; // Database connection


// GOOGLE OAUTH MODELS
export async function findOAuthUser(provider, subject) {
    const [result] = await pool.query('SELECT * FROM oauth_users WHERE provider = ? AND subject = ?', [provider, subject]);
    return result;
}

export async function findUserByEmailInUsersTable(email) {
    const [result]= await pool.query('SELECT * FROM users where  email = ?', [email]);
    return result;
}

export async function createUserInUsersTable(name, email, user_role, is_verified) {
    const [result] = await pool.query('INSERT INTO users (name, email, user_role, is_verified) VALUES (?, ?, ?, ?)', [name, email, user_role, is_verified]);
    return result.affectedRows > 0 ? result.insertId : null;
}

export async function createUserInOAuthTable(userId, provider, subject) {
    const [result] = await pool.query('INSERT INTO oauth_users (user_id, provider, subject) VALUES (?, ?, ?)', [userId, provider, subject]);
    return result.affectedRows > 0 ? result.insertId : null;
}

export async function findUserById(userId) {
    const [[result]] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return result;
}



// FACEBOOK OAUTH MODELS