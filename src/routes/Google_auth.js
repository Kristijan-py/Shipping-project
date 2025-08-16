import express from 'express';
import jwt from 'jsonwebtoken'; // Pass the login using token
import passport from 'passport'; // Passport for authentication
import GoogleStrategy from 'passport-google-oauth20'; // Google OAuth strategy
import { pool } from '../config/database.js'; // connect to the database
import cookieParser from 'cookie-parser'; // to use cookies in all routes
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
router.use(express.json());
router.use(passport.initialize()); // must have for passport to work
router.use(cookieParser()); 



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const[rows] = await pool.query('SELECT * FROM oauth_users WHERE provider = ? AND subject = ?', ['google', profile.id]);

      if (rows.length === 0) { // USER DOES NOT EXIST
        // Check again with email
        let userId;
        const [existingEmail] = await pool.query('SELECT * FROM users where  email = ?', [profile.emails?.[0]?.value])

        if(existingEmail.length === 0){
          // create a user in the database
          const [userResult] = await pool.query('INSERT INTO users (name, email, user_role, is_verified) VALUES (?, ?, ?, ?)', [profile.displayName, profile.emails?.[0]?.value, 'user', 1]);
          userId = userResult.insertId; // if  not existed
          console.log("New user created successfully!");
        } else {
          userId = existingEmail[0].id; // if existed
        }
            
        await pool.query('INSERT INTO oauth_users (user_id, provider, subject) VALUES (?, ?, ?)', [userId, 'google', profile.id]);

        const user = {
          id: userId,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          role: 'user'
        };

        return cb(null, user);

      } else { // IF USER EXISTS
          console.log("User already exists in the database, logging in...");

          const [[userRow]] = await pool.query('SELECT * FROM users WHERE id = ?', [rows[0].user_id]); // double array because its array and we must put 0 to access the user, not the whole array
          const user = {
            id: userRow.id,
            name: userRow.name,
            email: userRow.email,
            role: userRow.user_role
          };

          return cb(null, user);
        }
    } catch (error) {
      console.error('Error during Google authentication:', error.message);
      return cb(error);
    }
  }
));

router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // we don't need session for this
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }), // if authentication fails, redirect to login
  function(req, res) {
    const token = jwt.sign({ id: req.user.id, email: req.user.email, role: req.user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: 'lax', // CSRF protection
      maxAge: 3600000 // 1 hour
    });


    res.redirect('/dashboard');
});

export default router;