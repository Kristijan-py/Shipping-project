import { createPool } from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env files
dotenv.config({ path: path.resolve(__dirname, '.env') });


export const pool = createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER, // Using .env for best practice and security
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10
}).promise();




// USERS TABLE
// @GET all users
export async function getUsers() { 
    try {
        const [rows] = await pool.query(`SELECT * FROM users`);
        return rows;

    } catch (error) {
        console.error('Erorr fetching ispiti: ', error.message);   
        return null;
    }
    
};

// @POST find user by email
export async function getUserByEmail(email) {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]); 
        return rows[0];

    } catch (error) {
        console.error('Error fetching the email: ' ,error.message);
        return null;
    }
}

// @GET user by id
export async function getUserById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]); 
        return rows[0];

    } catch (error) {
        console.error("Error fetching data: " ,error.message);
        return null;
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
        return null;
    }
}

// @PUT user by id
export async function updateUser(id ,name, phone, email,  password_hash) {
    const [data] = await pool.query
    (`UPDATE users
    SET name = ?, phone = ?, email = ?, password_hash = ?
    WHERE id = ?` , [name, phone, email, password_hash, id]);
    return;
}

// @DELETE user by phone number
export async function deleteUser(phone) {
    try {
        const [data] = await pool.query
        (`DELETE FROM users
        WHERE phone = ?` , [phone]);

        if(data.affectedRows > 0) {
            console.log('User is deleted!✅');
            return true;
        } else {
            console.log('User not found ❌');
            return false;
        }
        
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}









// ORDERS TABLE
// @GET all orders
export async function getOrders() {
    try {
        const [rows] = await pool.query('SELECT * FROM orders');
        return rows;
    } catch (error) {
        console.log('Error fetching orders: ', error.message);
        return null;
    }
}

// @GET order by id
export async function getOrderById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        return rows[0];

    } catch (error) {
        console.error("Error fetching order: " , error.message);
        return null;
    }
}

// @POST order
export async function createOrder(user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying) {
    try {
        const [data] = await pool.query(`INSERT INTO orders (user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying]);
        return data;
    } catch (error) {
        console.error("Error creating order: ", error.message);
    }
}

// To see if the order is duplicate
export async function duplicateOrderCheck(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price, package_type, whos_paying) {
    try {
        const [rows] = await pool.query(`SELECT * FROM orders WHERE sender_name = ? AND sender_phone = ? AND buyer_name = ? AND buyer_phone = ? AND buyer_city = ? AND buyer_village = ? AND price = ? AND package_type = ? AND whos_paying = ?`, 
        [sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price, package_type, whos_paying]);
        return rows[0];
    } catch (error) {
        console.error("Error fetching order by details: ", error.message);
        return null;
    }
}


// @DELETE order
export async function deleteOrder(id) {
    try {
        const [data] = await pool.query('DELETE FROM orders WHERE id =?', [id]);
        if(data.affectedRows > 0) {
            console.log('Order deleted successfully! ✅');
            return true;
        } else {
            console.log('Order not found ❌');
            return false;
        }
    } catch (error) {
        console.error("Error deleting order: ", error.message);
        throw error;
    }
}




export default pool;   
