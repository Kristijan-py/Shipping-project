import pool from "../config/database.js";

// USERS TABLE
// @GET all users
export async function getUsers() { 
    const [rows] = await pool.query(`SELECT id, name, phone, email, created_at, is_verified FROM users`);
    return rows;
};

// @POST find user by email
export async function getUserByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]); 
    return rows[0];
}

// @GET user by id
export async function getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]); 
    return rows[0];
}

// @POST a user
export async function createUser(name, phone, email, password_hash, user_role) {
    const [data] = await pool.query
    (`INSERT INTO users (name, phone, email, password_hash, user_role)
    VALUES (?, ?, ?, ?, ?)` , [name, phone, email,  password_hash, user_role]);
    const id = data.insertId;
    return getUserById(id);
}

// @DELETE user by id
export async function deleteUser(id) {
    const [data] = await pool.query
    (`DELETE FROM users
    WHERE id = ?` , [id]);
    return data.affectedRows > 0;
}