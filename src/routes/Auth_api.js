import express from 'express';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { signupController, loginController, verifyEmailController, forgotPasswordController, resetPasswordController } from '../controllers/authenticationControllers.js';
import { logoutController } from '../controllers/userControllers.js'
import { authenticateToken } from '../middleware/auth_roles.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended: false}));



router.post('/signup', signupController);
router.post('/login', loginRateLimit, loginController);
router.get('/verify-email', verifyEmailController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/logout', authenticateToken, logoutController); // we use jwt here to pass the email to helper function to remove tokens from DB from that user

export default router;