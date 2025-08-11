import validator from 'validator'; // for validating info
import {pool} from './database.js'; // for database connection
import nodemailer from 'nodemailer'; // for sending emails
import fs from 'fs';



// ADDING +389
export function normalizePhoneNumber(phone) {
    if(!phone) {
        return "Phone number is required.";
    }

    let digits = phone.replace(/\D/g,'');

    if(digits.startsWith('0')) {
        digits = digits.slice(1);
        digits = 389 + digits;
        return '+' + digits;
    }

    if(digits.startsWith('389')) {
        digits = 389 + digits;
        return '+' + digits;
    }  
};

//VALIDATION FOR LETTER ONLY INPUTS
export function isOnlyLetters(str){
    return /^[a-zA-z]+$/.test(str);
}

// VALIDATION FOR PASSWORD
export function validatePassword(password){
    const passwordMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$+_%^&*(),.?":{}|<>]/.test(password);

    if (!passwordMinLength) return 'Password must have at least 8 characters.';
    if (!hasUppercase) return 'Password must have at least one uppercase letter.';
    if (!hasNumber) return 'Password must have at least one number.';
    if (!hasSymbol) return 'Password must have at least one symbol.';

    return true; // if everything passes, return true
}

// VALIDATION FOR PHONE NUMBER
export function validatePhoneNumber(phoneNumber){
    const phoneRegex = /^(07\d{7}|\+3897\d{7})$/; // phone regex for Macedonia
    if(phoneRegex.test(phoneNumber)){
        return true;
    } else{
        return "Phone number must start with '07' and be 9 digits long.";
    }

}


// VALIDATION FOR EMAIL
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return '❌ Invalid email format. Example: user@gmail.com';
    }
    
    return true;
}

// Check email, phone and pass
export function validateUserInput({email, phone, password, confirm_password}) {
    // Check email
    if(!validator.isEmail(email)) {
        return  "Invalid email format ❌";    
    }
    const emailValidation = validateEmail(email.toLowerCase());
    if(emailValidation !== true) {
        return emailValidation;
    }
    // Check phone number
    if(!validatePhoneNumber(phone)) {
        return "Invalid phone format(example 077446614) ❌";
    }
    // Add +389 on your phone
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check password
    const passValidation = validatePassword(password);
    if(passValidation !== true) {
        return passValidation;
    }

    const confirmPassValidation = validatePassword(confirm_password);
    if(confirmPassValidation !== true) {
        return confirmPassValidation;
    }
    if(password !== confirm_password) {
        return "Passwords do not match ❌";
    }

    return true;
}

// Orders info validation
export function validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price) {
    const letterFields = [
        {value: sender_name, field: 'Sender Name'},
        {value: buyer_name, field: 'Buyer Name'},
        {value: buyer_city, field: 'Buyer City'},
        {value: buyer_village, field: 'Buyer Village'}
    ];

    for(const {value, field} of letterFields){
        if(value && !isOnlyLetters(value)){ // ? is for safe checking if values is empty or not
            return { valid: false , error: `${field} must contain only letters`}
        }
    }

    // COMPARE PHONES
    if(sender_phone === buyer_phone && sender_phone !== '' && buyer_phone !== ''){
        return { valid: false , error: `Cannot have same phone numbers for sender and buyer`}
    }


    // PHONES
    if(sender_phone !== ''){
        const validateSenderPhone = validatePhoneNumber(sender_phone);
        if(validateSenderPhone !== true) {
            return { valid: false , error: validateSenderPhone}
        }
    }
    if(buyer_phone !== ''){
        const validateBuyerPhone = validatePhoneNumber(buyer_phone);
        if(validateBuyerPhone !== true) {
            return { valid: false , error: validateBuyerPhone}
        }
    }
    // PRICE
    if(price < 0 || isNaN(price)){
        return { valid: false , error: 'price under 0 or not contain only numbers'}
    }

    return {valid: true};
};


export function validateOrderInfoArray(fieldsToUpdate) {
    const { sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price } = fieldsToUpdate;

    return validateOrderInfo(sender_name, sender_phone, buyer_name, buyer_phone, buyer_city, buyer_village, price);
    
};


// Checking user from database to see if it exists
export async function ifUserExists(email, phone) {
    try {
        const normalizePhone = normalizePhoneNumber(phone); // to make +389....
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, normalizePhone]);
        return rows.length > 0; // ITS BOOLEAN => if we found 1 user return true, otherwise false
    } catch (error) {
        console.error("Error checking if user exists:", error.message);
        throw new Error("Database error while checking user");
    }
}

// Sending email to reset password
export async function sendresetEmail(email, link) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // for self-signed certificates (without ssl)
        }
    });
    try {
        await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password reset',
        html: `<p>Click the link to reset your password:     <button><a href="${link}">Reset Password</a></button></p>
        <p>If you did not request this, please ignore this email.</p>`,
    });
        console.log("Reset email sent successfully ✅");

    } catch (error) {
        console.error("Error sending reset email:", error.message);
        throw new Error("Failed to send reset email");
        
    }
    
}

// Sending email for verification
export async function verifyEmail(email, link) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // for self-signed certificates (without ssl)
        }
    });
    try {
        await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your Email',
        html: `<p>Click the link to verify your email:     <button><a href="${link}">Verify Email</a></button></p>
        <p>If you did not request this, please ignore this email.</p>`,
    });
        console.log("Verification email sent successfully ✅");

    } catch (error) {
        console.error("Error sending verification email:", error.message);
        throw new Error("Failed to send verification email");
        
    }
}

// Cleans unverified users every 20m
export function startCleanupInterval() {
    setInterval(async () => {
        try {
        const [result] = await pool.query(`
            DELETE FROM users
            WHERE is_verified = 0
            AND email_token is NOT NULL 
            AND email_token_expires < NOW()
        `);
        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Skopje' });
        const logEntry = `Deleted ${result.affectedRows} unverified users - ${timestamp}\n `;
            console.log(logEntry); // to see in the terminal when the interval passed

        fs.appendFile('../SHIPPING_SOFTWARE/logs/delete.log', logEntry, (err) => {
            if(err) {
                console.error('Error writing to the file ', err.message);
            }
        });

    } catch (error) {
        console.error('Error cleaning the unverified users', error.message);
    }
    }, 1000 * 60  * 20); // Refresh every 20 minutes
}