import express from 'express';
import passport from 'passport'; // Passport for authentication
import GoogleStrategy from 'passport-google-oauth20'; // Google OAuth strategy
import cookieParser from 'cookie-parser'; // to use cookies in all routes
import dotenv from 'dotenv';
import { handleGoogleOAuth, handleGoogleOAuthCallback } from '../controllers/OAuthControllers.js';

dotenv.config();

const router = express.Router();
router.use(express.json());
router.use(passport.initialize()); // must have for passport to work
router.use(cookieParser()); 


// Google OAuth routes
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  }, handleGoogleOAuth // controller function
)); 

router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // we don't need session for this
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }), 
  handleGoogleOAuthCallback // controller function
); // if authentication fails, redirect to login



// Facebook OAuth routes




export default router;