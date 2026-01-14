import express from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth_roles.js';
import { getUsersController, getUserByIdController, updateUserController, deleteUserController } from '../controllers/userControllers.js';

const router = express.Router();
router.use(express.json());

// User Routes
router.get('/users', authenticateToken, authorizeAdmin, getUsersController);
router.get('/users/:id', authenticateToken, authorizeAdmin, getUserByIdController);
router.put('/updateUser', authenticateToken, authorizeAdmin, updateUserController);
router.delete('/deleteUser/:id', authenticateToken, deleteUserController);



export default router;