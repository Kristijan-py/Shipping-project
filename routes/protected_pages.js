import express from 'express';
import path from 'path';    
import { authenticateToken } from '../middleware/JWT-Error-Logger-Roles.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getOrders } from '../src/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router(); 







// @GET dashboard page
router.get('/dashboard', authenticateToken, (req, res) => {  // secure page with JWT authentication
  try {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
  } catch (error) {
    console.error("Error sending dashboard page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// @GET Create Orders page
router.get('/createOrder', authenticateToken, (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'public', 'createOrder.html'));
  } catch (error) {
    console.error('Error sending create orders page ', error.message);
    res.status(500).send("Internal Server Error");
  }

});


// @GET view page ejs
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await getOrders();
        if (!orders || orders.length === 0) {
            return res.status(404).render('orders', { orders: [], error: "No orders found." });
        }

        res.render('orders', {orders, error: null}); // when render is called, express knows is ejs and search for views foulder where i setted in server.js
    } catch (error) {
        console.log('Error fetching orders: ', error.message);
        res.status(500).send({error: "Internal server error"})
    }
});

export default router;