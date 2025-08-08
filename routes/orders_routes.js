import express from 'express';
const router = express.Router();

import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from '../src/database.js';
import { authenticateToken } from '../middleware/JWT-Error-Logger-Roles.js';
import { error } from 'console';

router.use(express.json());
router.use(express.urlencoded({ extended: false }));


// @GET all orders
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await getOrders();
        if(!orders) {
            return res.status(404).send({error: "Orders not found!"});
        }
        res.status(200).send(orders);

    } catch (error) {
        console.log('Error fetching orders: ', error.message);
        res.status(500).send({error: "Internal server error"})
    }
})


// @GET a order by id
router.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const order = await getOrderById(id);
        if(!order) {
            return res.status(404).send({error: "Order not found!"});
        }
        res.status(200).send(order);

    } catch (error) {
        console.log('Error fetching order: ', error.message);
        res.status(500).send({error: "Internal server error"})
    }
})

// @POST a order
router.post('/createOrder', authenticateToken, async (req, res) => {
    const { sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying } = req.body;
    try {
        const newOrder = await createOrder(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying);
        console.log('Order created');
        res.status(201).send('Order created');
    } catch (error) {
        console.log("Error while creating a order: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
})


// @PUT a order
router.put('/updateOrder', authenticateToken, async (req, res) => {
    const { id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying } = req.body
    try {

        const updatedOrder = await updateOrder(id, sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, buyer_adress, price, package_type, whos_paying);
        if(!updatedOrder) {
            return res.status(404).send({error: "Order not found!"});
        }
        res.status(200).send(updatedOrder);
    } catch (error) {
        console.log("Error while updating a order: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
})


// @DELETE a order by ID
router.delete('/deleteOrder', authenticateToken, async (req, res) => {
    const success = await deleteOrder(req.body.id);
    if(!success) return res.status(404).send({error: "Order not found with that ID "});

    res.status(200).send({msg: "Order deleted! ✅"});
})



export default router;