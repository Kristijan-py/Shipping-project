import express from 'express';
import { redirectIfAuthenticated } from '../middleware/auth.js';
import path from 'path';    
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
router.use(express.json());


// @GET redirect to dashboard page if token is present
router.get('/', redirectIfAuthenticated, (req, res) => {
   try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
  } catch (error) {
    console.error("Error sending signup page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


// @GET login page
router.get('/login', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
  } catch (error) {
    console.error("Error sending login page:", error.message);
    res.status(500).send("Internal Server Error");
  }
}); 

// @GET signup page
router.get('/signup', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'signup.html'));
  } catch (error) {
    console.error("Error sending signup page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// @GET forgot password page
router.get('/forgot-password', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'forgot-password.html'));
  } catch (error) {
    console.error("Error sending forgot password page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// @GET reset password page
router.get('/reset-password', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'reset-password.html'));
  } catch (error) {
    console.error("Error sending reset password page:", error.message);
    res.status(500).send("Internal Server Error");
    
  }
});


// @GET verify email page
router.get('/verify-email-page', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'verify-email-page.html'));
  } catch (error) {
    console.error("Error sending verification success page:", error.message);
    res.status(500).send("Internal Server Error");
  }
});


export default router;