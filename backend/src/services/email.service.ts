import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    return transporter;
};

export const sendVerificationEmail = async (to: string, token: string) => {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

    const mailOptions = {
        from: '"GenZ Social" <noreply@genzsocial.com>',
        to,
        subject: 'Verifikasi Akun GenZ Social Kamu! 🎉',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f9fc;">
        <h2 style="color: #06B6D4;">Welcome to GenZ Social! 🚀</h2>
        <p>Thanks for joining us! Please verify your email to unlock all features.</p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #06B6D4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verifikasi Akun Saya</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="font-size: 10px; color: #999;">Link berlaku selama 24 jam.</p>
      </div>
    `,
    };

    try {
        if (process.env.SMTP_USER === 'ethereal_user') {
            console.log('\n==== MOCK EMAIL ====');
            console.log(`To: ${to}`);
            console.log(`Verify Link: ${verifyLink}`);
            console.log('====================\n');
            return;
        }
        const info = await getTransporter().sendMail(mailOptions);
        console.log('Verification email sent:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
