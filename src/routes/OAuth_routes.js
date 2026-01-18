import express from 'express';
import passport from 'passport'; // Passport for authentication
import GoogleStrategy from 'passport-google-oauth20'; // Google OAuth strategy
import FacebookStrategy from 'passport-facebook'; // Facebook OAuth strategy
import cookieParser from 'cookie-parser'; // to use cookies in all routes
import dotenv from 'dotenv';
import { handleGoogleOAuth, handleGoogleOAuthCallback, handleFacebookOAuth, handleFacebookOAuthCallback } from '../controllers/OAuthControllers.js';

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
    session: false // we don't need session for this, as we are using JWT
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }), 
  handleGoogleOAuthCallback // controller function
); // if authentication fails, redirect to login



// Facebook OAuth routes
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_SECRET_KEY,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails'] // Request email field
  },
  handleFacebookOAuth // controller function
));

router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile'], 
    session: false // we don't need session for this, as we are using JWT
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  handleFacebookOAuthCallback // controller function);
); // if authentication fails, redirect to login


export default router;