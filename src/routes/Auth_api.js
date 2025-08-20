import express from 'express';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { signupController, loginController, verifyEmailController, forgotPasswordController, resetPasswordController, logoutController } from '../controllers/authenticationControllers.js';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended: false}));



router.post('/signup', signupController);
router.post('/login', loginRateLimit, loginController);
router.post('/verify-email', verifyEmailController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/logout', logoutController);

export default router;
