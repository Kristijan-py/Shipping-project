import express from 'express';
import bcrypt from "bcrypt"; // hashing passwords
import crypto from 'crypto'; // for generating secure tokens
import jwt from 'jsonwebtoken'; // Pass the login using token
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { normalizePhoneNumber, validateUserInput, ifUserExists, sendresetEmail, validatePassword, verifyEmail } from '../src/helperFunctions.js';
import { pool } from '../src/database.js'; // Database connection
import {getUserByEmail, createUser} from '../src/database.js';

const router = express.Router();
router.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// @POST a user SIGNUP
router.post('/signup', async (req, res) => {
    try {
        console.log("Password:", req.body.password);
        console.log("Confirm:", req.body.confirm_password);

        // Check if user already exists
        const ifUserExist = await ifUserExists(req.body.email, req.body.phone);
        if(ifUserExist) {
            return res.status(400).send({error: "User with this email or phone number already exists"});
        }

        const validationUser = validateUserInput(req.body);
        if(validationUser !== true){
            return res.status(400).send({error: validationUser});
        }
        

        const salt = await bcrypt.genSalt(); // just in case some have the same pass, use salt for additional chars(every salt is different)
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const normalizePhone = normalizePhoneNumber(req.body.phone); // to make +389....

        // Creating user in database
        const user = { name: req.body.name, phone: normalizePhone, email: req.body.email, password: hashedPassword, role: 'user' };
        const newUser = await createUser(user.name, user.phone, user.email, user.password, user.role);
        if(!newUser) {
            return res.status(400).send({error: "Cannot create user, problem with database"});
        }
        console.log("User created successfully ✅");

        // EMAIL VERIFICATION
        const emailToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(emailToken).digest('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 15 + 120 * 60_000); // 120 * 60_000 is for UTC+2 for Macedonia

        await pool.query('UPDATE users SET email_token = ?, email_token_expires = ? WHERE email = ?', 
            [hashedToken, expires, req.body.email]
        );

        const link = `${req.protocol}://${req.get('host')}/verify-email?token=${emailToken}&email=${req.body.email}`;
        await verifyEmail(req.body.email, link); // sendimg a mail to the user

        return res.redirect('/dashboard'); // redirect to dashboard page after signup

    } catch (error) {
        console.log("Error while creating a user: ", error.message);
        return false;
    }
})


// @POST a user LOGIN
router.post('/login', async (req, res) => {
    try {
        const user = await getUserByEmail(req.body.email);
        if(!user){
            return res.status(404).send({error: "Email not found"});
        }
    
        const passCheck = await bcrypt.compare(req.body.password, user.password_hash);
        if(!passCheck) {
            return res.status(400).send({error: "Incorrect password!"});
        };

        if(user.is_verified !== true){
            return res.status(403).send({error: "Verify your email before logging in."});
        }


        // JWT
        const accessToken = jwt.sign({id: user.id, email: user.email, role: user.role}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'}); // create token with user id and email, expires in 15 minutes
        res.cookie("token", accessToken, {
            httpOnly: true,      // JS can't access it
            secure: false,       // true in production with HTTPS
            sameSite: 'strict',  // CSRF protection
            maxAge: 900000       // 15 minutes   
        });
        
        console.log("Logged in successfully ✅");
        console.log("JWT payload:", { id: user.id, email: user.email, role: user.role }); // for debugging

        return res.redirect('/dashboard'); // redirect to dashboard page after login

    } catch (error) {
        console.log("Error while logging a user: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
})


// @GET verify email
router.get('/verify-email', async (req, res) => {
    const { token, email } = req.query;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find a user with that info that sign up 
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND email_token = ? AND email_token_expires > NOW()', 
        [email, hashedToken]
    );
    // Check that user if exist
    if(users.length === 0) {
        return res.status(400).send({error: 'Invalid or expired token'});
    };

    // If exists in DATABASE, verify it
    await pool.query(
        'UPDATE users SET is_verified = true, email_token = NULL, email_token_expires = NULL WHERE email = ?',
        [email]
    );

    res.sendFile(path.join(__dirname, '..', 'public', 'verify-email.html'));

})

// @POST forgot password
router.post('/forgotPassword', async (req, res) => {
    try {
        const user = await getUserByEmail(req.body.email);
        if(!user) {
            return res.status(404).send({error: "Email not found"});
        }

        // Generate a random token for password reset
        const resetToken = crypto.randomBytes(32).toString('hex'); // generate a secure random token
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex'); // hashing the token
        const resetTokenExpiration = new Date(Date.now() + 900000 + 120 * 60_000) // 15 minutes expiration time (+ 120 * 60_000 is for UTC +2 timezone for Macedonia)
        .toISOString()
        .slice(0, 19).replace('T', ' '); // format to MySQL datetime

        await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [resetTokenHash, resetTokenExpiration, user.email]);

        const link = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}&email=${user.email}`; // link to reset password
        console.log(link);
        await sendresetEmail(user.email, link); // send the reset link to the user's email for verification if the user is in our database
        return res.status(200).send({message: "Password reset link sent to your email!"});

    } catch (error) {
        console.log("Error while processing forgot password: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
})

// @POST reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, email } = req.query; // from URL
        const { newPassword, confirmPassword } = req.body; // FROM THE HTML FORM

        if (!resetToken || !email || !newPassword || !confirmPassword) {
            return res.status(400).send({error: "All fields are required"});
        }
        if(newPassword !== confirmPassword){
            return res.status(400).send({error: "Passwords doesn't match"});
        }

        const validationPass = validatePassword(newPassword);
        if(validationPass !== true) return res.status(400).send({error: validationPass});


        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // must be the same as in forgotpass to match 
        
        const [result] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()', [email, hashedToken]
        );
        if (result.length === 0) {
            return res.status(400).send({error: "Invalid or expired reset token"})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // new password + hashing + salt

        await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', 
            [hashedPassword, email]
        );

        res.status(200).send({success: "Password reset succsessfully !"});

    } catch (error) {
        console.log("Error while resetting password: ", error.message);
        res.status(500).send({error: "Internal server error"});
    }
});


// @POST logout
router.post('/logout', (req, res) => {
    // Clear the cookie
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, // true in production with HTTPS
        sameSite: 'strict'   // LAX for CSRF protection and strict for same-site requests
    }); 

    console.log("Logged out successfully ✅");
    return res.redirect('/login');
});

export default router;