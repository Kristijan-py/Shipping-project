import pool from "../config/database.js";
import { AppError } from "../utils/AppError.js";

// ORDERS TABLE
// @GET all orders
export async function getOrders() {
    try {
        const [rows] = await pool.query('SELECT * FROM orders');
        return rows;
    } catch (error) {
        throw new AppError(`Error fetching orders: ${error.message}`, 500);
    }
}

// @Get orders by user_id
export async function getOrdersByUserId(userId) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
        return rows;
    } catch (error) {
        throw new AppError(`Error fetching orders: ${error.message}`, 500);
    }
}

// @GET order by id
export async function getOrderById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        return rows[0];

    } catch (error) {
        throw new AppError(`Error fetching order: ${error.message}`, 500);
    }
}

// @POST order
export async function createOrder(user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying) {
    try {
        const [data] = await pool.query(`INSERT INTO orders (user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying]);
        return data;
    } catch (error) {
        throw new AppError(`Error creating order: ${error.message}`, 500);
    }
}


// @DELETE order
export async function deleteOrder(id, userId) {
    try {
        const [data] = await pool.query('DELETE FROM orders WHERE id =? AND user_id = ?', [id, userId]);
        if(data.affectedRows > 0) {
            console.log(`Order ${id} deleted successfully! ✅`);
            return true;
        } else {
            console.log(`Order ${id} not found or not yours❌`);
            return false;
        }
    } catch (error) {
        throw new AppError(`Error deleting order: ${error.message}`, 500);
    }
}