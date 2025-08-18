import pool from "../config/database.js";

// ORDERS TABLE
// @GET all orders
export async function getOrders() {
    try {
        const [rows] = await pool.query('SELECT * FROM orders');
        return rows;
    } catch (error) {
        console.log('Error fetching orders: ', error.message);
        throw error;
    }
}

// @Get orders by user_id
export async function getOrdersByUserId(userId) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
        return rows;
    } catch (error) {
        console.log('Error fetching orders: ', error.message);
        throw error;
    }
}

// @GET order by id
export async function getOrderById(id) {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        return rows[0];

    } catch (error) {
        console.error("Error fetching order: " , error.message);
        throw error;
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
        throw error;
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