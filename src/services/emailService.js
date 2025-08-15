import nodemailer from 'nodemailer'; // for sending emails




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