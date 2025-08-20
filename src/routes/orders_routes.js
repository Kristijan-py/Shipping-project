import express from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth_roles.js';
import { getOrdersController, getOrdersByUserIdController, getOrderByIdController, createOrderController, updateOrderController, deleteOrderController } from '../controllers/orderControllers.js';


const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: false }));


router.get('/orders', authenticateToken, authorizeAdmin, getOrdersController);
router.get('/orders/user/:userId', authenticateToken, authorizeAdmin, getOrdersByUserIdController);
router.get('/orders/:id', authenticateToken, authorizeAdmin, getOrderByIdController);
router.post('/createOrder', authenticateToken, createOrderController);
router.put('/updateOrder', authenticateToken, updateOrderController); // we should change this to PUT and DELETE with method override
router.delete('/orders/:id', authenticateToken, deleteOrderController);


export default router;