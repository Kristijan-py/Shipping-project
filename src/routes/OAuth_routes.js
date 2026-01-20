import express from 'express';
import session from 'express-session';
import passport from 'passport'; // Passport for authentication
import GoogleStrategy from 'passport-google-oauth20'; // Google OAuth strategy
import FacebookStrategy from 'passport-facebook'; // Facebook OAuth strategy
import cookieParser from 'cookie-parser'; // to use cookies in all routes
import dotenv from 'dotenv';
import { handleGoogleOAuth, handleGoogleOAuthCallback, handleFacebookOAuth, handleFacebookOAuthCallback } from '../controllers/OAuthControllers.js';

dotenv.config();

const router = express.Router();
router.use(express.json());
router.use(cookieParser()); 

router.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // use a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.SECURE_COOKIE === 'true', 
    maxAge: 60000 // Only lasts 1 minute
  }
}));

router.use(passport.initialize()); // must have for passport to work


// Google OAuth routes
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CLIENT_URL}/auth/google/callback`,
    state: true,
  }, handleGoogleOAuth // controller function
)); 

router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // we don't need session for this, as we are using JWT(true means the data will be stored forever in server memory)
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }), 
  handleGoogleOAuthCallback // controller function
); // if authentication fails, redirect to login



// Facebook OAuth routes
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_SECRET_KEY,
    callbackURL: `${process.env.CLIENT_URL}/auth/facebook/callback`,
    state: true,
    profileFields: ['id', 'displayName', 'emails'] // Request email field
  },
  handleFacebookOAuth // controller function
));

router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile'], 
    session: false // we don't need session for this, as we are using JWT(true means the data will be stored forever in server memory)
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  handleFacebookOAuthCallback // controller function);
); // if authentication fails, redirect to login


export default router;