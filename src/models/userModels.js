import pool from "../config/database.js";

// USERS TABLE
// @GET all users
export async function getUsers() { 
    try {
        const [rows] = await pool.query(`SELECT * FROM users`);
        return rows;

    } catch (error) {
        console.error('Error fetching users: ', error.message);
        throw error;
    }
    
};

// @POST find user by email
export async function getUserByEmail(email) {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]); 
        return rows[0];

    } catch (error) {
        console.error('Error fetching the email: ', error.message);
        throw error;
    }
}

// @GET user by id
export async function getUserById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]); 
        return rows[0];

    } catch (error) {
        console.error("Error fetching data: " ,error.message);
        throw error;
    }
}

// @POST a user
export async function createUser(name, phone, email, password_hash, user_role) {
    try {
        const [data] = await pool.query
        (`INSERT INTO users (name, phone, email, password_hash, user_role)
        VALUES (?, ?, ?, ?, ?)` , [name, phone, email,  password_hash, user_role]);
        const id = data.insertId;
        return getUserById(id);
        
    } catch (error) {
        console.error('Error creating user: ', error.message);
        throw error;
    }
}

// @PUT user by id
export async function updateUser(id ,name, phone, email,  password_hash) {
    try {
        const [data] = await pool.query
        (`UPDATE users
        SET name = ?, phone = ?, email = ?, password_hash = ?
        WHERE id = ?` , [name, phone, email, password_hash, id]);
        return getUserById(id);
        
    } catch (error) {
        console.error('Error updating user: ', error.message);
        throw error;
    }
}

// @DELETE user by id
export async function deleteUser(id) {
    try {
        const [data] = await pool.query
        (`DELETE FROM users
        WHERE id = ?` , [id]);

        if(data.affectedRows > 0) {
            console.log(`User ${id} is deleted!✅`);
            return true;
        } else {
            console.log(`User ${id} not found ❌`);
            return false;
        }
        
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}