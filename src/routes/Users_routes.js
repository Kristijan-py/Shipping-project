import express from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth_roles.js';
import { getUsersController, deleteUserController } from '../controllers/userControllers.js';

const router = express.Router();
router.use(express.json());

// User Routes
router.get('/users', authenticateToken, authorizeAdmin, getUsersController); // Fetch all users(ADMIN only)
router.delete('/deleteUser/:id', authenticateToken, deleteUserController); // Delete a user by id



export default router;