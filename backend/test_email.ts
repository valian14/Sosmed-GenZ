import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing SMTP connection with:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'NOT SET');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false, // TLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.verify();
        console.log('Connection verified successfully:', info);

        console.log('Attempting to send an email...');
        const sendResult = await transporter.sendMail({
            from: '"GenZ Social Test" <test@genzsocial.com>',
            to: process.env.SMTP_USER,
            subject: 'Test Email from Backend',
            text: 'If you see this, the email configuration is fully working!'
        });
        console.log('Test email sent successfully:', sendResult.messageId);
    } catch (err) {
        console.error('SMTP Error:', err);
    }
}

test();
