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

export default router;