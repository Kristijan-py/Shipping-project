import nodemailer from 'nodemailer'; // for sending emails

// HTML & CSS email template
export function emailTemplate({ title, message, buttonText, link }) {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:40px;">
        <div style="
            max-width:480px;
            margin:0 auto;
            background:#ffffff;
            padding:30px;
            border-radius:8px;
            box-shadow:0 4px 10px rgba(0,0,0,0.1);
            text-align:center;
        ">
            <h2 style="color:#333; margin-bottom:15px;">
                ${title}
            </h2>

            <p style="color:#555; font-size:14px; margin-bottom:25px;">
                ${message}
            </p>

            <a href="${link}" style="
                display:inline-block;
                padding:12px 24px;
                background:#4f46e5;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;
                font-size:14px;
            ">
                ${buttonText}
            </a>

            <p style="color:#999; font-size:12px; margin-top:25px;">
                If you did not request this, you can safely ignore this email.
            </p>
        </div>
    </div>
    `;
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

    const htmlContent = emailTemplate({
        title: 'Reset Your Password',
        message: 'Click the button below to reset your password.',
        buttonText: 'Reset Password',
        link: link
    });
    
    // Send the email
    try {
        await transporter.sendMail({
        from: "Brza pratka <"+process.env.EMAIL_USER+">",
        to: email,
        subject: 'Password reset',
        html: htmlContent,
        text: `Please reset your password by clicking the following link: ${link}`
    });
        console.log("Reset email sent successfully ✅");

    } catch (error) {
        throw error;
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

    const htmlContent = emailTemplate({
        title: 'Verify your email',
        message: 'Click the button below to verify your email.',
        buttonText: 'Verify Email',
        link: link
    });
    
    // Send the email
    try {
        await transporter.sendMail({
        from: "Brza pratka <"+process.env.EMAIL_USER+">",
        to: email,
        subject: 'Verify your Email',
        html: htmlContent,
        text: `Please verify your email by clicking the following link: ${link}`
    });
        console.log("Verification email sent successfully ✅");

    } catch (error) {
        throw error;
    }
}