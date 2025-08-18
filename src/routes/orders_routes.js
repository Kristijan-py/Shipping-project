import express from 'express';
const router = express.Router();

import { pool } from '../config/database.js'; // connect to the database
import { getOrders, getOrdersByUserId, getOrderById, createOrder, deleteOrder } from '../repository/orderRepository.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth_roles.js';
import { validateOrderInfo, validateOrderInfoArray } from '../services/validation.js';
import { error } from 'console';
import { AppError } from '../utils/AppError.js';
import { getOrSetCache } from '../utils/caching.js'; // Helper function for caching
import redisClient from '../config/redis.js';

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

const defaultTTL = 3600; // for cache expiration

// @GET all orders
router.get('/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        // Check Redis cache
        const orders = await getOrSetCache('orders', getOrders, defaultTTL);
        if(!orders || orders.length === 0) {
            return res.status(404).send({error: "No orders found!"});
        }

        res.status(200).send(orders);
    } catch (error) {
        throw new AppError(`Error fetching orders: ${error.message}`, 500);
    }
})

// @GET orders by user ID
router.get('/orders/user/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        // Check Redis cache
        const orders = await getOrSetCache(`orders:user:${userId}`, getOrdersByUserId.bind(null, userId), defaultTTL); // we use bind to add a argument to the function
        if(!orders || orders.length === 0) {
            return res.status(404).send({error: "No orders found!"});
        }
        
        res.status(200).send(orders);
    } catch (error) {
        throw new AppError(`Error fetching user orders: ${error.message}`, 500);
    }
})


// @GET a order by id
router.get('/orders/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Check Redis cache
        const orders = await getOrSetCache(`orders:${id}`, getOrderById.bind(null, id), defaultTTL);
        if(!orders || orders.length === 0) {
            return res.status(404).send({error: "No order found!"});
        }
        
        res.status(200).send(orders);

    } catch (error) {
        throw new AppError(`Error fetching orders by ID: ${error.message}`, 500);
    }
});

// @POST a order
router.post('/createOrder', authenticateToken, async (req, res) => {
    if(req.user.id !== parseInt(req.body.userId)){ // check if the user is the owner
        return res.status(403).send({error: "You are not authorized to create this order."});
    }
    const { sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying } = req.body;
    const userId = req.user.id; // from jwt token

    // CHECK VALIDATION
    const validateInput = validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price);
    if(validateInput.valid !== true) {
        return res.status(400).send({error: validateInput.error});
    }
    
    try {
        const newOrder = await createOrder(userId, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying);
        res.redirect('/dashboard');
    } catch (error) {
        throw new AppError(`Error while creating an order: ${error.message}`, 500);
    }
})



// UPDATE order 
router.post('/updateOrder', authenticateToken, async (req, res) => {
    const { id, ...fieldsToUpdate } = req.body;  // ...somename --> create array with that name
    if(!id) return res.status(400).send({error: 'Order ID is required'});
    console.log(fieldsToUpdate)
    const updates =[];
    const values = [];

    for (const field in fieldsToUpdate){ // for every field in the form 
        if(fieldsToUpdate[field] !== '') { // this check if the value isn't empty to push that into update
            updates.push(`${field} = ?`); // this must be the same as in sql query
            values.push(fieldsToUpdate[field]);
        }
    }

    if(updates.length === 0){
        return res.status(400).send('No field to update');
    }

    values.push(id); // last for WHERE id = ?
    values.push(req.user.id); // user_id for security check(Avoiding another users to update other orders)

    // CHECKING VALIDATION
    const validateInfo = validateOrderInfoArray(fieldsToUpdate);
    if(validateInfo.valid !== true){
        return res.status(400).send({error: validateInfo.error})
    }


    try {
        const SQLFunction = `UPDATE orders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
        const [result] = await pool.query(SQLFunction, values);
    
        if(result.affectedRows === 0){
            return res.status(404).send({error: 'Order not found'});
        }
        // Delete cache from Redis
        await redisClient.del(`orders:${id}`);
        res.redirect('/dashboard');

    } catch (error) {
        throw new AppError(`Error updating the order: ${error.message}`, 500);
    }
});


// @DELETE a order by ID
router.post('/orders/:id/delete', authenticateToken, async (req, res) => {
    try {
        const success = await deleteOrder(req.params.id, req.user.id); // pass user id for security check
        if(!success) return res.status(404).send({error: "Order not found with that ID "});
        // Delete cache from Redis
        await redisClient.del(`orders:${req.params.id}`);
        await redisClient.del(`orders`); // we also delete orders because the deleted orders is still inside
        await redisClient.del(`orders:user:${req.user.id}`);
        
        res.status(200).send({msg: "Order deleted! ✅"});
        
    } catch (error) {
        throw new AppError(`Error with deleting the order: ${error.message}`, 500);
    }
})



export default router;