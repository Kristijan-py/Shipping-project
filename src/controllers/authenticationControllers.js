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
import { insertUserEmailToken, findUserByEmailToken, verifyUserEmail, insertUserResetToken, findUserByResetToken, updateUserPassword, removeTokenWhenLogout } from '../models/authenticationModels.js'; // Model for updating user email token
import { AppError } from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from "../utils/helperFunctions.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// @POST a user SIGNUP
export async function signupController(req, res, next) {
    try {
        // Check if user already exists
        const ifUserExist = await ifUserExists(req.body.email, req.body.phone);
        if(ifUserExist) { // can be true or false so in that case dont put !
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
        const expires = new Date(Date.now() + 1000 * 60 * 15);

        await insertUserEmailToken(hashedToken, expires, req.body.email); // insert user email token, expiration and the email

        const link = `${process.env.BASE_URL}/api/verify-email?token=${emailToken}&email=${req.body.email}`;
        await verifyEmail(req.body.email, link); // sendimg a mail to the user

        res.redirect('/login'); // redirect to login page after signup

    } catch (error) {
        next(new AppError(`Error while creating a user: ${error.message}`, 500));
    }
};


// @POST a user LOGIN
export async function loginController(req, res, next) {
    try {
        const user = await getUserByEmail(req.body.email);
        if(!user){
            return res.status(404).send({error: "Email not found"});
        }
        // Check if it has password, sometimes we dont because of Google login
        if(user.password_hash === null || user.password_hash === undefined) {
            // If no password hash, it means user is logging in with Google
            // Here you can implement the logic for Google login
            return res.status(200).send({message: "No password set due to Google login, signup required."});
        };
    
        const passCheck = await bcrypt.compare(req.body.password, user.password_hash);
        if(!passCheck) {
            return res.status(400).send({error: "Incorrect password!"});
        };

        if(user.is_verified !== 1){
            return res.status(403).send({error: "Verify your email before logging in."});
        }


        // JWT
        const payload = { id: user.id, email: user.email, role: user.user_role }; 

        const accessToken = await generateAccessToken(payload);
        const refreshToken = await generateRefreshToken(payload);

        // Access token
        res.cookie("accessToken", accessToken, {
            httpOnly: true,    
            secure: false,       // true in production with HTTPS
            sameSite: 'lax',  // With lax I can use it on redirects
            maxAge: 15 * 60 * 1000       // 15 minutes
        });

        // Refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,       // true in production with HTTPS
            sameSite: 'lax',  // With lax I can use it on redirects
            maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
        });
        
        console.log("Logged in successfully ✅");
        console.log("JWT payload:", { id: user.id, email: user.email, role: user.user_role }); // for debugging

        return res.redirect('/dashboard'); // redirect to dashboard page after login

    } catch (error) {
        next(new AppError(`Error while logging in: ${error.message}`, 500));
    }
};


// @GET verify email
export async function verifyEmailController(req, res, next) {
    try {
        const { token, email } = req.query;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
        // Find a user with that info that sign up 
        const [users] = await findUserByEmailToken(email, hashedToken);
        // Check that user if exist
        if(users.length === 0) {
            return res.status(400).send({error: 'Invalid or expired token'});
        };
    
        // If exists in DATABASE, verify it
        verifyUserEmail(email);
    
        res.redirect('/login?is_verified=true'); // redirect to login page after verification
        
    } catch (error) {
        next(new AppError(`Error while verifying email: ${error.message}`, 500));
    }

};

// @POST forgot password
export async function forgotPasswordController(req, res, next) {
    try {
        const user = await getUserByEmail(req.body.email);
        if(!user) {
            return res.status(404).send({error: "Email not found"});
        }

        // Generate a random token for password reset
        const resetToken = crypto.randomBytes(32).toString('hex'); // generate a secure random token
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex'); // hashing the token
        const resetTokenExpiration = new Date(Date.now() + 900000 + 120 * 60_000) // 15 minutes expiration time (120 * 60_00 for UTC+2 timezone)
        .toISOString()
        .slice(0, 19).replace('T', ' '); // format to MySQL datetime

        await insertUserResetToken(resetTokenHash, resetTokenExpiration, user.email);

        const link = `${process.env.BASE_URL}/reset-password?resetToken=${resetToken}&email=${user.email}`; // link to reset password
        console.log(link);
        await sendresetEmail(user.email, link); // send the reset link to the user's email for verification if the user is in our database
        return res.status(200).send({message: "Password reset link sent to your email!"});

    } catch (error) {
        next(new AppError(`Error while processing forgot password: ${error.message}`, 500));
    }
};

// @POST reset password
export async function resetPasswordController(req, res, next) {
    try {
        const { resetToken, email, newPassword, confirmPassword } = req.body; // FROM THE HTML FORM

        if (!resetToken || !email || !newPassword || !confirmPassword) {
            return res.status(400).send({error: "All fields are required"});
        }
        if(newPassword !== confirmPassword){
            return res.status(400).send({error: "Passwords doesn't match"});
        }

        const validationPass = validatePassword(newPassword);
        if(validationPass !== true) return res.status(400).send({error: validationPass});


        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // must be the same as in forgotpass to match 
        
        const [result] = await findUserByResetToken(email, hashedToken);
        if (result.length === 0) {
            return res.status(400).send({error: "Invalid or expired reset token"})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); // new password + hashing + salt

        await updateUserPassword(email, hashedPassword);

        res.status(200).send({success: "Password reset succsessfully !"});

    } catch (error) {
        next(new AppError(`Error while resetting password: ${error.message}`, 500));
    }
};


// @POST logout
export async function logoutController(req, res, next) {
    try {
        await removeTokenWhenLogout(req.user.email); // removing tokens from DB

        // Clear the cookies
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: 'strict'   // LAX for CSRF protection and strict for same-site requests
        }); 

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: 'strict'   // LAX for CSRF protection and strict for same-site requests
        });

        console.log("Logged out successfully ✅");
        return res.redirect('/login');
        
    } catch (error) {
        next(new AppError(`Error while logging out: ${error.message}`, 500));
    }
};
