import express from 'express';
import path from 'path';    
import { authenticateToken } from '../middleware/JWT-Error-Logger-Roles.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router(); 







// @GET home page
router.get('/dashboard', authenticateToken, (req, res) => {  // secure page with JWT authentication
  try {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
  } catch (error) {
    console.error("Error sending dashboard page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


export default router;