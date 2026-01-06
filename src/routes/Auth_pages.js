import express from 'express';
import { redirectIfAuthenticated } from '../middleware/auth_roles.js';
import path from 'path';    
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
router.use(express.json());


// @GET redirect to dashboard page if token is present
router.get('/', redirectIfAuthenticated, (req, res) => {
   try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'homepage.html'));
  } catch (error) {
    throw new AppError(`Error sending login page: ${error.message}`, 500);
  }
});


// @GET login page
router.get('/login', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'login.html'));
  } catch (error) {
    throw new AppError(`Error sending login page: ${error.message}`, 500);
  }
}); 

// @GET signup page
router.get('/signup', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'signup.html'));
  } catch (error) {
    throw new AppError(`Error sending signup page: ${error.message}`, 500);
  }
});

// @GET forgot password page
router.get('/forgot-password', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'forgot-password.html'));
  } catch (error) {
    throw new AppError(`Error sending forgot password page: ${error.message}`, 500);
  }
});

// @GET reset password page
router.get('/reset-password', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'reset-password.html'));
  } catch (error) {
    throw new AppError(`Error sending reset password page: ${error.message}`, 500);
  }
});


// @GET verify email page
router.get('/verify-email-page', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'pages', 'verify-email-page.html'));
  } catch (error) {
    throw new AppError(`Error sending verification success page: ${error.message}`, 500);
  }
});


export default router;