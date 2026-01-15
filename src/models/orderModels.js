import pool from "../config/database.js";

// ORDERS TABLE
// @GET all orders
export async function getOrders() {
    const [rows] = await pool.query('SELECT * FROM orders');
    return rows;
}

// @Get orders by user_id
export async function getOrdersByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
    return rows;
}

// @GET order by id
export async function getOrderById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0];
}

// @POST order
export async function createOrder(user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying) {
    const [data] = await pool.query(`INSERT INTO orders (user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [user_id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying]);
    return data;
}


// @DELETE order
export async function deleteOrder(id, userId) {
    const [data] = await pool.query('DELETE FROM orders WHERE id =? AND user_id = ?', [id, userId]);
    return data.affectedRows > 0;
}


// To see if the order is duplicated only if upload from files(otherwise no because maybe user wants to create same order again with minimal changes)
export async function duplicateOrderCheck(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price, package_type, whos_paying, user_id) {
    const [rows] = await pool.query(`SELECT * FROM orders WHERE sender_name = ? AND sender_phone = ? AND buyer_name = ? AND buyer_phone = ? AND buyer_city = ? AND buyer_village = ? AND price = ? AND package_type = ? AND whos_paying = ? AND user_id = ?`, 
    [sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price, package_type, whos_paying, user_id]);
    return rows[0];
}