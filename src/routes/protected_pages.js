import express from 'express';
import { getUserById } from '../models/userModels.js';
import path from 'path';    
import { authenticateToken } from '../middleware/auth_roles.js';
import { paginateResults } from '../middleware/pagination.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router(); 




// @GET dashboard page
router.get('/dashboard', authenticateToken, (req, res) => {  // secure page with JWT authentication
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'dashboard.html'));
  } catch (error) {
    throw new AppError(`Error sending dashboard page: ${error.message}`, 500);
  }
});

// @GET Create Orders page
router.get('/createOrder', authenticateToken, (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'createOrder.html'));
  } catch (error) {
    throw new AppError(`Error sending create orders page: ${error.message}`, 500);
  }
});

// @GET all orders from specific user on ejs page
router.get('/orders', authenticateToken, paginateResults, async (req, res) => {
  try {
    if(!req.pagination || !req.pagination.results) { // Checking pagination
      return res.status(404).render('orders', {orders: [], error: "No orders found."})
    }

    res.render('orders', {orders: req.pagination.results, pagination: req.pagination, error: null}); // we send the orders and pagination info
  } catch (error) {
    throw new AppError(`Error fetching orders: ${error.message}`, 500);
  }
});

// @GET Create Orders page
router.get('/updateOrder', authenticateToken, (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'updateOrder.html'));
  } catch (error) {
    throw new AppError(`Error sending update orders page: ${error.message}`, 500);
  }
});

// @GET Upload Orders page 
router.get('/uploadOrders', authenticateToken, (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'uploadOrders.html'));
  } catch (error) {
    throw new AppError(`Error sending upload orders page: ${error.message}`, 500);
  }
});

// @GET Profile page
router.get('/profilePage', authenticateToken, async (req, res) => {
  try {
    const info = await getUserById(req.user.id);
    if (!info) {
      return res.status(404).render('profilePage', { user: null, error: "User not found." });
    }

    res.render('profilePage', {user: info, error: null}); // when render is called, express knows is ejs and search for views foulder where i setted in server.js
  } catch (error) {
    throw new AppError(`Error fetching user: ${error.message}`, 500);
  }
});

// @GET Delete Account page
router.get('/deleteAccount', authenticateToken, async (req, res) => {
  try {
    const info = await getUserById(req.user.id);
    if (!info) {
      return res.status(404).render('deleteAccount', { user: null, error: "User not found." });
    }

    res.render('deleteAccount', {user: info, error: null}); // when render is called, express knows is ejs and search for views foulder where i setted in server.js
  } catch (error) {
    throw new AppError(`Error fetching user: ${error.message}`, 500);
  }
});


export default router;