import bcrypt from "bcrypt"; // hashing passwords
import crypto from 'crypto'; // for generating secure tokens
import jwt from 'jsonwebtoken'; // Pass the login using token
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { normalizePhoneNumber, validateUserInput, ifUserExists,  validatePassword } from '../services/validation.js';
import { sendresetEmail, verifyEmail } from '../services/emailService.js'; // Email service for sending verification and reset emails
import { getUserByEmail, createUser } from '../models/userModels.js';
import { insertUserEmailToken, findUserByEmailToken, verifyUserEmail, insertUserResetToken, findUserByResetToken, updateUserPassword } from '../models/authenticationModels.js'; // Model for updating user data
import { AppError } from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from "../utils/helperFunctions.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// @POST a user SIGNUP
export async function signupController(req, res, next) {
    try {
        // Check if user already exists
        const ifUserExist = await ifUserExists(req.body.email, req.body.phone);
        if(ifUserExist) { // can be true or false so in that case dont put "!"
            return res.status(400).send({error: "User with this email or phone number already exists"});
        }
        // If user does not exist, validate input
        const validationUser = validateUserInput(req.body);
        if(validationUser !== true){
            return res.status(400).send({error: validationUser});
        }
        
        // Normalizing and hashing data for security 
        const normalizeEmail = (req.body.email).toLowerCase();
        const salt = await bcrypt.genSalt(); // just in case some have the same pass, use salt for additional chars(every salt is different)
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const normalizePhone = normalizePhoneNumber(req.body.phone); // to make +389....

        // Creating user in Database
        const user = { name: req.body.name, phone: normalizePhone, email: normalizeEmail, password: hashedPassword, role: 'user' };
        const newUser = await createUser(user.name, user.phone, user.email, user.password, user.role);
        if(!newUser) {
            return res.status(400).send({error: "Cannot create user, problem with database"});
        }
        console.log("User created successfully ✅");

        // EMAIL VERIFICATION
        const emailToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(emailToken).digest('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        
        await insertUserEmailToken(hashedToken, expires, normalizeEmail); // insert user email token, expiration and the email

        const link = `${process.env.BASE_URL}/api/verify-email?token=${emailToken}`; // sending unhashed token because in query it should be as it is different than in the DB for security(hackers!). We will hash in verify controller instead.
        await verifyEmail(normalizeEmail, link); // sendimg a mail to the user

        res.redirect('/login'); // redirect to login page after signup

    } catch (error) {
        next(new AppError(`Error while creating a user: ${error.message}`, 500));
    }
};


// @POST a user LOGIN
export async function loginController(req, res, next) {
    try {
        // Check if user exists
        const user = await getUserByEmail(req.body.email);
        if(!user){
            return res.status(404).send({error: "Email not found"});
        }
        // Check password
        const passCheck = await bcrypt.compare(req.body.password, user.password_hash);
        if(!passCheck) {
            return res.status(400).send({error: "Incorrect password!"});
        };
        // This will force the user to check email accunt to verify before login
        if(user.is_verified !== 1){
            return res.status(403).send({error: "Verify your email before logging in."});
        }
        // Remember me for cookies and tokens
        const rememberMe = req.body.rememberMe === 'on'; // remember me checkbox boolean
        const rememberMeAccessTime = rememberMe ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15m | 5m
        const rememberMeRefreshTime = rememberMe ? 15 * 60 * 60 * 1000 * 24 : 1 * 60 * 60 * 1000 ; // 15 days | 1 hour
        
        // JWT
        const payload = { id: user.id, email: user.email, role: user.user_role };
        // Pass payload to add to cookies and also remember me option to match cookie and token expiration time
        const accessToken = await generateAccessToken(payload, rememberMe);
        const refreshToken = await generateRefreshToken(payload, rememberMe);
       
        
        // Storing tokens in HTTP-ONLY COOKIES
        // Access token
        res.cookie("accessToken", accessToken, {
            httpOnly: true,    
            secure: false,       // true in production with HTTPS
            sameSite: 'lax',  // With lax I can use it on redirects
            maxAge: rememberMeAccessTime
        });

        // Refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,       // true in production with HTTPS
            sameSite: 'lax',  // With lax I can use it on redirects
            maxAge: rememberMeRefreshTime
        });

        
        console.log("Logged in successfully ✅");

        return res.redirect('/dashboard'); // redirect to dashboard page after login

    } catch (error) {
        next(new AppError(`Error while logging in: ${error.message}`, 500));
    }
};


// @GET verify email
export async function verifyEmailController(req, res, next) {
    try {
        const { token } = req.query; // send from signup controller in query
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
        // Find a user with that info that signed up from DB
        const [users] = await findUserByEmailToken(hashedToken);
        // Check that user if still exist because maybe token expired
        if(users.length === 0) {
            return res.status(400).send({error: 'Invalid or expired token'}); // Time expired, signup again
        };
    
        // If exists in DATABASE, verify it
        await verifyUserEmail(users.email);
    
        res.redirect('/login?is_verified=true'); // redirect to login page after verification
        
    } catch (error) {
        next(new AppError(`Error while verifying email: ${error.message}`, 500));
    }

};

// @POST forgot password
export async function forgotPasswordController(req, res, next) {
    try {
        // Find if user exists
        const user = await getUserByEmail(req.body.email);
        if(!user) {
            return res.status(404).send({error: "Email not found"});
        }

        // Generate a token for password reset
        const resetToken = crypto.randomBytes(32).toString('hex'); // generate a secure token
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex'); // hashing the token
        const resetTokenExpiration = new Date(Date.now() + 15 * 60 * 1000 + 1 * 60 * 60 * 1000) // 15 minutes expiration time
        .toISOString()
        .slice(0, 19).replace('T', ' '); // format to MySQL datetime

        await insertUserResetToken(resetTokenHash, resetTokenExpiration, user.email); // store hashed token in DB

        const link = `${process.env.BASE_URL}/reset-password?resetToken=${resetToken}`; // link to reset password
        await sendresetEmail(user.email, link); // send the reset password link to the user's email
        return res.status(200).send({message: "Password reset link sent to your email!"});

    } catch (error) {
        next(new AppError(`Error while processing forgot password: ${error.message}`, 500));
    }
};

// @POST reset password
export async function resetPasswordController(req, res, next) {
    try {
        // Check required fields
        const { resetToken, newPassword, confirmPassword } = req.body; // FROM THE HTML FORM
        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).send({error: "All fields are required"});
        }
        if(newPassword !== confirmPassword){
            return res.status(400).send({error: "Passwords doesn't match"});
        }
        // validate password
        const validationPass = validatePassword(newPassword);
        if(validationPass !== true) return res.status(400).send({error: validationPass});

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // must be the same as in forgotpass to match 
        const users = await findUserByResetToken(hashedToken);
        if (users.length === 0) {
            return res.status(400).send({error: "Invalid or expired reset token"}) // User is not found
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // new password + hashing + salt
        const user = users[0];
        await updateUserPassword(user.email, hashedPassword);
        res.status(200).send({success: "Password reset succsessfully !"});
        
    } catch (error) {
        next(new AppError(`Error while resetting password: ${error.message}`, 500));
    }
};



